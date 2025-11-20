# Project Templates and Workflow Automation

This module provides comprehensive project templates and workflow automation capabilities for the JasaWeb platform, enabling standardized project delivery processes and automated workflows.

## Features

### 🏗️ Project Template System

- **Pre-defined Templates**: Templates for School Websites, News Portals, and Company Profiles
- **Customizable Templates**: Create and modify templates to suit specific needs
- **Template Versioning**: Track and manage template versions
- **Template Analytics**: Monitor template usage and effectiveness

### ⚙️ Workflow Automation Engine

- **Trigger-based Automation**: Automate actions based on project events
- **Custom Workflow Rules**: Create custom automation rules
- **Real-time Processing**: Process workflow events in real-time
- **Integration Ready**: Seamlessly integrates with existing project systems

### 📊 Analytics and Insights

- **Template Usage Statistics**: Track which templates are most popular
- **Effectiveness Metrics**: Measure template performance and success rates
- **Workflow Analytics**: Monitor workflow execution and performance

## Database Schema

### Core Tables

#### ProjectTemplate

```sql
- id: String (Primary Key)
- name: String
- description: String?
- serviceType: Enum (school-website, news-portal, company-profile)
- isActive: Boolean
- version: String
- settings: Json?
- createdAt: DateTime
- updatedAt: DateTime
```

#### MilestoneTemplate

```sql
- id: String (Primary Key)
- projectTemplateId: String (Foreign Key)
- title: String
- description: String?
- order: Int
- durationDays: Int?
- isRequired: Boolean
- settings: Json?
- createdAt: DateTime
- updatedAt: DateTime
```

#### TaskTemplate

```sql
- id: String (Primary Key)
- milestoneTemplateId: String (Foreign Key)
- title: String
- description: String?
- order: Int
- assigneeRole: String?
- durationDays: Int?
- isRequired: Boolean
- settings: Json?
- createdAt: DateTime
- updatedAt: DateTime
```

#### WorkflowRule

```sql
- id: String (Primary Key)
- name: String
- description: String?
- trigger: String
- condition: Json?
- action: String
- parameters: Json?
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

## API Endpoints

### Project Templates

#### Template Management

- `GET /project-templates` - List all active templates
- `GET /project-templates/:id` - Get template by ID
- `POST /project-templates` - Create new template
- `PATCH /project-templates/:id` - Update template
- `DELETE /project-templates/:id` - Delete template

#### Template Application

- `POST /project-templates/:id/apply` - Apply template to create project

#### Milestone Templates

- `POST /project-templates/:templateId/milestones` - Create milestone template
- `PATCH /project-templates/milestones/:id` - Update milestone template
- `DELETE /project-templates/milestones/:id` - Delete milestone template

#### Task Templates

- `POST /project-templates/milestones/:milestoneTemplateId/tasks` - Create task template
- `PATCH /project-templates/tasks/:id` - Update task template
- `DELETE /project-templates/tasks/:id` - Delete task template

#### Analytics

- `GET /project-templates/analytics/usage-stats` - Get template usage statistics
- `GET /project-templates/:id/analytics/effectiveness` - Get template effectiveness metrics

### Workflow Automation

#### Workflow Rules

- `GET /workflow-automation/rules` - List all active rules
- `GET /workflow-automation/rules/:id` - Get rule by ID
- `POST /workflow-automation/rules` - Create new rule
- `PATCH /workflow-automation/rules/:id` - Update rule
- `DELETE /workflow-automation/rules/:id` - Delete rule

#### Setup and Analytics

- `POST /workflow-automation/setup-default-rules` - Setup default workflow rules
- `GET /workflow-automation/analytics/execution-stats` - Get execution statistics

## Usage Examples

### Creating a Project Template

```typescript
const template = await projectTemplateService.createProjectTemplate({
  name: 'Custom Website Template',
  description: 'Template for custom website projects',
  serviceType: 'company-profile',
  settings: {
    estimatedDuration: 45,
    teamSize: 3,
    technologies: ['React', 'Node.js', 'PostgreSQL'],
  },
});
```

### Adding Milestones to Template

```typescript
const milestone = await projectTemplateService.createMilestoneTemplate({
  projectTemplateId: template.id,
  title: 'Design Phase',
  description: 'UI/UX design and mockups',
  order: 1,
  durationDays: 10,
  isRequired: true,
});
```

### Adding Tasks to Milestone

```typescript
const task = await projectTemplateService.createTaskTemplate({
  milestoneTemplateId: milestone.id,
  title: 'Create Wireframes',
  description: 'Design low-fidelity wireframes',
  order: 1,
  assigneeRole: 'ux-designer',
  durationDays: 3,
});
```

### Applying Template to Project

```typescript
const project = await projectTemplateService.applyTemplateToProject(
  template.id,
  {
    name: 'New Client Website',
    organizationId: 'org-123',
    startAt: new Date(),
  }
);
```

### Creating Workflow Rules

```typescript
const rule = await workflowAutomationService.createWorkflowRule({
  name: 'Auto-approval for completed milestones',
  description: 'Creates approval request when milestone is completed',
  trigger: 'milestone_status_changed',
  condition: { newStatus: 'completed' },
  action: 'create_approval',
  parameters: {
    itemType: 'milestone',
    note: 'Milestone completed - awaiting approval',
  },
});
```

## Available Triggers

- `project_created` - When a new project is created
- `milestone_created` - When a new milestone is created
- `task_completed` - When a task is marked as completed
- `project_status_changed` - When project status changes
- `milestone_status_changed` - When milestone status changes

## Available Actions

- `create_approval` - Create an approval request
- `send_notification` - Send a notification
- `create_task` - Create a new task
- `update_status` - Update project or milestone status
- `create_milestone` - Create a new milestone

## Default Templates

The system includes three pre-configured templates:

### School Website Template

- **Duration**: 60 days
- **Team Size**: 3 people
- **Features**: Student Portal, Teacher Dashboard, Event Calendar, News Section
- **Milestones**: 7 phases from Discovery to Deployment

### News Portal Template

- **Duration**: 45 days
- **Team Size**: 4 people
- **Features**: Article Management, Category System, Search, Comments, Analytics
- **Milestones**: 6 phases from Content Strategy to Integration

### Company Profile Template

- **Duration**: 30 days
- **Team Size**: 2 people
- **Features**: About Us, Services, Portfolio, Contact Form, Blog
- **Milestones**: 5 phases from Brand Analysis to Launch

## Default Workflow Rules

The system includes default workflow rules for:

1. **Auto-approval Creation**: Creates approval requests for completed milestones
2. **Status Notifications**: Sends notifications for project status changes
3. **Follow-up Tasks**: Creates review tasks after task completion
4. **Status Progression**: Automatically advances project status based on milestones

## Testing

### Unit Tests

```bash
npm test -- project-template.service.spec.ts
npm test -- workflow-automation.service.spec.ts
```

### Integration Tests

```bash
npm test -- project-template.integration.spec.ts
```

## Database Seeding

To populate the database with default templates:

```bash
npx ts-node prisma/seed-templates.ts
```

## Configuration

### Environment Variables

No additional environment variables are required for this module. It uses the existing database configuration.

### Template Settings

Templates can include custom settings in JSON format:

```typescript
{
  "estimatedDuration": 60,        // days
  "teamSize": 3,                  // number of people
  "technologies": ["React", "Node.js"],
  "features": ["Feature1", "Feature2"],
  "customSettings": {
    "clientRequirements": true,
    "specialConsiderations": []
  }
}
```

## Performance Considerations

- Template application creates multiple database records in a transaction
- Workflow rules are processed asynchronously to avoid blocking
- Template analytics use aggregated queries for better performance
- Consider caching frequently accessed templates

## Security

- Template management is restricted to admin and owner roles
- Workflow rule creation requires admin privileges
- All template operations are properly validated
- SQL injection protection through Prisma ORM

## Future Enhancements

- Template inheritance and composition
- Advanced workflow designer
- Template marketplace
- AI-powered template recommendations
- Advanced workflow analytics
- Integration with external workflow engines
