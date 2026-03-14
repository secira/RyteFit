import { db } from "../db";
import { workflowEvents, workflowRuns } from "@shared/schema";
import { WorkflowEventPayload, WorkflowEventType } from "./event-types";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

// PostgreSQL channel for workflow events
const WORKFLOW_CHANNEL = 'workflow_events_channel';

// Event emitter - publishes events to PostgreSQL and emits NOTIFY
export class WorkflowEventEmitter {
  private sequenceCounters: Map<string, number> = new Map();

  /**
   * Emit a workflow event
   * - Persists to workflowEvents table
   * - Emits PostgreSQL NOTIFY for real-time subscribers
   * - Returns idempotency key for duplicate prevention
   */
  async emit(payload: WorkflowEventPayload): Promise<string> {
    const { workflowRunId, applicationId, jobId, eventType, fromState, toState, data } = payload;

    // Generate idempotency key: hash of (workflowRunId + eventType + timestamp)
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${workflowRunId}-${eventType}-${payload.timestamp.toISOString()}`)
      .digest('hex');

    // Get next sequence number for this workflow run
    const sequenceNumber = await this.getNextSequenceNumber(workflowRunId);

    try {
      // Persist event to database with jobId
      const [event] = await db.insert(workflowEvents).values({
        workflowRunId,
        applicationId,
        jobId,
        eventType,
        fromState: fromState || null,
        toState: toState || null,
        eventData: data as any || {},
        idempotencyKey,
        sequenceNumber,
        status: 'pending',
      }).returning();

      // Emit PostgreSQL NOTIFY for real-time subscribers
      await db.execute(sql`
        NOTIFY ${sql.raw(WORKFLOW_CHANNEL)}, ${JSON.stringify({
          eventId: event.id,
          workflowRunId,
          applicationId,
          eventType,
          sequenceNumber,
        })}
      `);

      console.log(`[EventBus] Emitted event: ${eventType} for application ${applicationId}`);
      
      return idempotencyKey;

    } catch (error: any) {
      // Handle duplicate idempotency key (event already processed)
      if (error.code === '23505' && error.constraint?.includes('idempotency')) {
        console.log(`[EventBus] Duplicate event ignored: ${eventType} for application ${applicationId}`);
        return idempotencyKey;
      }
      throw error;
    }
  }

  /**
   * Get next sequence number for a workflow run
   * Uses in-memory counter with fallback to database query
   */
  private async getNextSequenceNumber(workflowRunId: string): Promise<number> {
    // Check in-memory counter first
    const current = this.sequenceCounters.get(workflowRunId) || 0;
    
    // Fallback: query database for highest sequence number
    const [result] = await db
      .select({ maxSeq: sql<number>`COALESCE(MAX(${workflowEvents.sequenceNumber}), 0)` })
      .from(workflowEvents)
      .where(eq(workflowEvents.workflowRunId, workflowRunId));

    const nextSeq = Math.max(current, result?.maxSeq || 0) + 1;
    this.sequenceCounters.set(workflowRunId, nextSeq);
    
    return nextSeq;
  }

  /**
   * Mark event as processed
   */
  async markProcessed(eventId: string): Promise<void> {
    await db.update(workflowEvents)
      .set({ 
        status: 'completed', 
        processedAt: new Date() 
      })
      .where(eq(workflowEvents.id, eventId));
  }

  /**
   * Mark event as failed
   */
  async markFailed(eventId: string, error: string): Promise<void> {
    await db.update(workflowEvents)
      .set({ 
        status: 'failed', 
        error,
        processedAt: new Date() 
      })
      .where(eq(workflowEvents.id, eventId));
  }
}

// Event listener - subscribes to PostgreSQL NOTIFY
export class WorkflowEventListener {
  private listeners: Map<WorkflowEventType | '*', Array<(payload: any) => Promise<void>>> = new Map();
  private isListening = false;

  /**
   * Subscribe to specific event type or all events ('*')
   */
  on(eventType: WorkflowEventType | '*', handler: (payload: any) => Promise<void>): void {
    const handlers = this.listeners.get(eventType) || [];
    handlers.push(handler);
    this.listeners.set(eventType, handlers);
  }

  /**
   * Start listening to PostgreSQL NOTIFY
   * Uses a dedicated database connection for LISTEN
   */
  async start(): Promise<void> {
    if (this.isListening) {
      console.log('[EventBus] Already listening');
      return;
    }

    this.isListening = true;
    
    // Note: This requires a separate PostgreSQL client for LISTEN/NOTIFY
    // For now, we'll poll the database for pending events
    // TODO: Implement proper LISTEN/NOTIFY with a dedicated pg client
    
    console.log('[EventBus] Started polling for workflow events');
    this.pollEvents();
  }

  /**
   * Poll database for pending events (temporary implementation)
   * TODO: Replace with proper LISTEN/NOTIFY using dedicated pg client
   */
  private async pollEvents(): Promise<void> {
    const POLL_INTERVAL = 2000; // 2 seconds

    const poll = async () => {
      if (!this.isListening) return;

      try {
        // Get pending events ordered by sequence
        const pendingEvents = await db
          .select()
          .from(workflowEvents)
          .where(eq(workflowEvents.status, 'pending'))
          .orderBy(workflowEvents.workflowRunId, workflowEvents.sequenceNumber)
          .limit(50); // Process batch of 50 events

        for (const event of pendingEvents) {
          await this.handleEvent(event);
        }

      } catch (error) {
        console.error('[EventBus] Polling error:', error);
      }

      // Continue polling
      setTimeout(poll, POLL_INTERVAL);
    };

    poll();
  }

  /**
   * Handle incoming event
   */
  private async handleEvent(event: any): Promise<void> {
    const eventType = event.eventType as WorkflowEventType;

    // Mark as processing
    await db.update(workflowEvents)
      .set({ status: 'processing' })
      .where(eq(workflowEvents.id, event.id));

    try {
      // Call specific event type handlers
      const specificHandlers = this.listeners.get(eventType) || [];
      for (const handler of specificHandlers) {
        await handler(event);
      }

      // Call wildcard handlers (listen to all events)
      const wildcardHandlers = this.listeners.get('*') || [];
      for (const handler of wildcardHandlers) {
        await handler(event);
      }

      // Mark as completed
      await db.update(workflowEvents)
        .set({ 
          status: 'completed', 
          processedAt: new Date() 
        })
        .where(eq(workflowEvents.id, event.id));

      console.log(`[EventBus] Processed event: ${eventType} (${event.id})`);

    } catch (error: any) {
      console.error(`[EventBus] Event handler error for ${eventType}:`, error);
      
      // Mark as failed
      await db.update(workflowEvents)
        .set({ 
          status: 'failed', 
          error: error.message,
          processedAt: new Date() 
        })
        .where(eq(workflowEvents.id, event.id));
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    this.isListening = false;
    console.log('[EventBus] Stopped listening');
  }
}

// Singleton instances
export const eventEmitter = new WorkflowEventEmitter();
export const eventListener = new WorkflowEventListener();
