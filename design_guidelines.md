# NEET/JEE Mock Test Platform Design Guidelines

## Design Approach
**Selected Approach**: Design System (Utility-Focused) with educational platform references
- **Justification**: Educational platforms prioritize functionality, efficiency, and reduced cognitive load during high-stress exam scenarios
- **References**: Khan Academy, Coursera exam interfaces, and Byju's test platforms
- **Key Principles**: Clarity, focus, minimal distraction, accessibility, and performance-oriented design

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light Mode: Deep Blue (220 85% 25%) for trust and focus
- Dark Mode: Soft Blue (220 70% 60%) for reduced eye strain
- Success: Green (142 69% 58%) for correct answers
- Error: Red (0 84% 60%) for incorrect answers
- Warning: Amber (43 96% 56%) for flagged questions
- Neutral: Cool Gray scale (220 13% varying lightness)

### B. Typography
- **Primary Font**: Inter (Google Fonts) for excellent readability
- **Secondary Font**: JetBrains Mono for code/formula display
- **Hierarchy**: 
  - Headers: 2xl-4xl, font-semibold
  - Body: base-lg, font-normal
  - Captions: sm, font-medium

### C. Layout System
**Tailwind Spacing Units**: 2, 4, 6, 8, 12, 16
- Standard padding: p-4, p-6
- Section spacing: mb-8, mt-12
- Component gaps: gap-4, gap-6
- Container max-widths: max-w-4xl for content, max-w-7xl for dashboards

### D. Component Library

**Navigation:**
- Clean sidebar navigation with subject categorization
- Breadcrumb trails for question navigation
- Progress indicators for test completion

**Forms & Inputs:**
- Large, clearly labeled form fields
- Radio buttons for multiple choice with generous touch targets
- Confirmation dialogs for critical actions (submit test)

**Data Displays:**
- Performance cards with clear metrics visualization
- Subject-wise progress bars with percentage indicators
- Ranking tables with alternating row colors

**Test Interface:**
- Question card layout with clear numbering
- Timer component with color-coded urgency states
- Review panel with question status indicators

**Overlays:**
- Modal dialogs for test instructions and confirmations
- Toast notifications for save confirmations and warnings

### E. Animations
Minimal, purpose-driven animations only:
- Subtle fade-ins for question transitions
- Progress bar updates with smooth transitions
- Loading states for data fetching

## Images
- **Hero Image**: None - prioritize immediate access to test dashboard
- **Educational Icons**: Subject-specific icons (physics, chemistry, biology, mathematics)
- **Achievement Graphics**: Simple medal/trophy icons for performance milestones
- **Placement**: Icons in navigation, small graphics in performance cards only

## Key Design Considerations
- **Accessibility**: High contrast ratios, keyboard navigation, screen reader support
- **Mobile Optimization**: Touch-friendly question selection, responsive timer placement
- **Cognitive Load**: Minimal UI during active testing, clear visual hierarchy
- **Performance**: Lightweight components, efficient question loading patterns