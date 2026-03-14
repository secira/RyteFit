import { eq } from 'drizzle-orm';
import { db } from '../db';
import { 
  applications, 
  users,
  jobs,
  companies,
  agentTasks,
} from '@shared/schema';
import { WorkflowEventEmitter } from '../workflow/event-bus';
import { WorkflowStates, WorkflowEventTypes } from '../workflow/event-types';

interface EmailTemplate {
  subject: string;
  body: string;
}

export class NotificationAgent {
  private eventEmitter: WorkflowEventEmitter;

  constructor(eventEmitter: WorkflowEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Generate email template based on workflow state
   */
  private getEmailTemplate(state: string, data: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    interviewLink?: string;
    rank?: number;
  }): EmailTemplate {
    const { candidateName, jobTitle, companyName, interviewLink, rank } = data;

    switch (state) {
      case WorkflowStates.SUBMITTED:
        return {
          subject: `Application Received - ${jobTitle}`,
          body: `Dear ${candidateName},

Thank you for applying to the ${jobTitle} position at ${companyName}.

We have received your application and our team will review it shortly. You will receive an update within 2-3 business days.

Best regards,
${companyName} Hiring Team`,
        };

      case WorkflowStates.SCREEN_PASSED:
        return {
          subject: `Next Steps - ${jobTitle} Interview`,
          body: `Dear ${candidateName},

Great news! Your application for ${jobTitle} at ${companyName} has been shortlisted.

Next Steps:
- You will receive an AI video interview link within 24 hours
- The interview will take approximately 30 minutes
- You can complete it at your convenience within 7 days

We look forward to learning more about you!

Best regards,
${companyName} Hiring Team`,
        };

      case WorkflowStates.SCREEN_FAILED:
        return {
          subject: `Application Update - ${jobTitle}`,
          body: `Dear ${candidateName},

Thank you for your interest in the ${jobTitle} position at ${companyName}.

After careful review of your application, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We appreciate the time you invested in applying and encourage you to apply for future opportunities that match your skills.

Best regards,
${companyName} Hiring Team`,
        };

      case WorkflowStates.INTERVIEW_SCHEDULED:
        return {
          subject: `Interview Ready - ${jobTitle}`,
          body: `Dear ${candidateName},

Your video interview for ${jobTitle} at ${companyName} is now ready!

Interview Link: ${interviewLink || '[Link will be provided]'}

Important Information:
- Complete the interview within 7 days
- Ensure you have a stable internet connection
- Find a quiet space with good lighting
- Allow browser access to camera and microphone
- The interview typically takes 30-45 minutes

You can pause and resume the interview if needed. Good luck!

Best regards,
${companyName} Hiring Team`,
        };

      case WorkflowStates.EVALUATED:
        return {
          subject: `Interview Completed - ${jobTitle}`,
          body: `Dear ${candidateName},

Thank you for completing the AI interview for ${jobTitle} at ${companyName}.

Our team is now reviewing your interview responses. You will receive an update on your application status within 3-5 business days.

We appreciate your time and interest in joining our team.

Best regards,
${companyName} Hiring Team`,
        };

      case WorkflowStates.RANKED:
        return {
          subject: `Application Status Update - ${jobTitle}`,
          body: `Dear ${candidateName},

We have completed our evaluation process for the ${jobTitle} position at ${companyName}.

Our hiring team is now making final decisions. You will hear from us within the next few days regarding next steps.

Thank you for your patience.

Best regards,
${companyName} Hiring Team`,
        };

      case WorkflowStates.SELECTED:
        return {
          subject: `Congratulations - ${jobTitle} Offer`,
          body: `Dear ${candidateName},

Congratulations! We are delighted to extend you an offer for the ${jobTitle} position at ${companyName}.

You ranked #${rank || 1} among all candidates, and we believe you would be an excellent addition to our team.

Next Steps:
- A recruiter will contact you within 24 hours with offer details
- Please review the offer carefully
- We look forward to discussing compensation and start date

Welcome to ${companyName}!

Best regards,
${companyName} Hiring Team`,
        };

      case WorkflowStates.REJECTED:
        return {
          subject: `Application Update - ${jobTitle}`,
          body: `Dear ${candidateName},

Thank you for interviewing for the ${jobTitle} position at ${companyName}.

After careful consideration, we have decided to move forward with another candidate for this role.

We were impressed by your qualifications and encourage you to apply for future openings that match your skills and experience.

Best regards,
${companyName} Hiring Team`,
        };

      default:
        return {
          subject: `Application Update - ${jobTitle}`,
          body: `Dear ${candidateName},

This is an automated update regarding your application for ${jobTitle} at ${companyName}.

Your application status has been updated. Please check your application portal for more details.

Best regards,
${companyName} Hiring Team`,
        };
    }
  }

  /**
   * Send email notification (stub - will integrate with actual email service)
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    workflowRunId: string;
    applicationId: string;
  }): Promise<boolean> {
    const { to, subject, body, workflowRunId, applicationId } = params;

    // TODO: Integrate with actual email service (Twilio SendGrid, AWS SES, etc.)
    console.log(`[NotificationAgent] Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}\n`);

    // Emit email sent event with actual workflow/application IDs for traceability
    await this.eventEmitter.emit({
      workflowRunId,
      applicationId,
      eventType: WorkflowEventTypes.EMAIL_SENT,
      data: {
        metadata: {
          recipient: to,
          subject,
        },
      },
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Send notification for application state change
   */
  async notifyApplicationStateChange(params: {
    applicationId: string;
    newState: string;
    workflowRunId?: string; // Optional workflow run ID for event traceability
  }): Promise<boolean> {
    const { applicationId, newState, workflowRunId } = params;

    console.log(`[NotificationAgent] Sending notification for application ${applicationId}, state: ${newState}`);

    try {
      // Get application details
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // Get job details
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, application.jobId));

      if (!job) {
        throw new Error(`Job ${application.jobId} not found`);
      }

      // Get candidate details with company information
      const [result] = await db
        .select({
          candidateFirstName: users.firstName,
          candidateLastName: users.lastName,
          candidateEmail: users.email,
          companyName: companies.name,
        })
        .from(users)
        .innerJoin(jobs, eq(jobs.id, application.jobId))
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(eq(users.id, application.candidateId));

      if (!result) {
        throw new Error(`Candidate or company information not found for application ${applicationId}`);
      }

      const candidateName = `${result.candidateFirstName || ''} ${result.candidateLastName || ''}`.trim() || 'Candidate';
      const companyName = result.companyName || 'Our Company';

      // Generate email template
      const template = this.getEmailTemplate(newState, {
        candidateName,
        jobTitle: job.title,
        companyName,
        rank: application.finalRank || undefined,
      });

      // Send email
      if (!result.candidateEmail) {
        throw new Error(`Candidate email not found for application ${applicationId}`);
      }

      // Use provided workflowRunId or fallback to applicationId for traceability
      const effectiveWorkflowRunId = workflowRunId || applicationId;

      await this.sendEmail({
        to: result.candidateEmail,
        subject: template.subject,
        body: template.body,
        workflowRunId: effectiveWorkflowRunId,
        applicationId,
      });

      console.log(`[NotificationAgent] Email sent to ${result.candidateEmail} for state ${newState}`);
      return true;

    } catch (error: any) {
      console.error(`[NotificationAgent] Error sending notification:`, error);
      throw error; // Rethrow to allow retry logic
    }
  }

  /**
   * Execute notification task from agent task queue
   */
  async executeTask(taskId: string): Promise<void> {
    console.log(`[NotificationAgent] Executing task ${taskId}`);

    try {
      // Get task
      const [task] = await db
        .select()
        .from(agentTasks)
        .where(eq(agentTasks.id, taskId));

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status === 'completed') {
        console.log(`[NotificationAgent] Task ${taskId} already completed`);
        return;
      }

      // Mark task as in progress
      await db.update(agentTasks)
        .set({ status: 'in_progress' })
        .where(eq(agentTasks.id, taskId));

      // Extract params from task
      const applicationId = task.applicationId;
      
      if (!applicationId) {
        throw new Error('Application ID not found in task');
      }

      // Get workflow state from taskData (should be explicitly provided)
      let newState = task.taskData?.workflowState as string || task.taskData?.emailType as string;

      if (!newState) {
        // If no explicit state, get current application status
        const [app] = await db.select({ status: applications.status })
          .from(applications)
          .where(eq(applications.id, applicationId));
        
        if (!app?.status) {
          throw new Error(`Could not determine workflow state for application ${applicationId}`);
        }
        
        newState = app.status;
        console.log(`[NotificationAgent] Using application status as workflow state: ${newState}`);
      }

      // Validate the state is a valid workflow state
      const validStates = Object.values(WorkflowStates);
      if (!validStates.includes(newState as any)) {
        throw new Error(`Invalid workflow state: ${newState}. Must be one of: ${validStates.join(', ')}`);
      }

      // Send notification with workflow run ID from task for event traceability
      const success = await this.notifyApplicationStateChange({
        applicationId,
        newState,
        workflowRunId: task.workflowRunId, // Pass workflow run ID from task
      });

      if (!success) {
        throw new Error('Failed to send notification email');
      }

      // Mark task as completed
      await db.update(agentTasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
          result: {
            success: true,
            data: { emailSent: true } as any,
          },
        })
        .where(eq(agentTasks.id, taskId));

      console.log(`[NotificationAgent] Completed task ${taskId}`);

    } catch (error: any) {
      console.error(`[NotificationAgent] Error executing task ${taskId}:`, error);

      // Update task with error
      await db.update(agentTasks)
        .set({
          status: 'failed',
          lastError: error.message,
        })
        .where(eq(agentTasks.id, taskId));

      throw error;
    }
  }
}
