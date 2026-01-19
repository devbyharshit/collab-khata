# Requirements Document

## Introduction

Collab Khata is a mobile-first web application designed to help content creators and influencers manage their brand partnerships efficiently. The system provides comprehensive tracking of brand deals, posting deadlines, payment expectations, and communication logs in a centralized platform.

## Glossary

- **System**: The Collab Khata application
- **Creator**: A content creator or influencer using the system
- **Brand**: A company or organization that collaborates with creators
- **Collaboration**: A specific brand partnership or deal between a creator and brand
- **Payment_Expectation**: An expected payment from a brand for a collaboration
- **Payment_Credit**: An actual payment received and credited to a payment expectation
- **Conversation_Log**: A record of communication between creator and brand
- **File_Attachment**: A file uploaded and associated with a collaboration
- **Auth_Service**: The authentication and authorization component
- **Dashboard**: The main overview interface showing financial summaries
- **Overdue_Payment**: A payment that has passed its promised date without being credited

## Requirements

### Requirement 1: User Authentication and Account Management

**User Story:** As a creator, I want to create an account and securely log in, so that I can access my private collaboration data.

#### Acceptance Criteria

1. WHEN a creator provides valid email and password, THE Auth_Service SHALL create a new user account
2. WHEN a creator attempts to register with an existing email, THE Auth_Service SHALL prevent duplicate registration and return an error
3. WHEN a creator provides valid login credentials, THE Auth_Service SHALL authenticate them and return a JWT token
4. WHEN a creator provides invalid login credentials, THE Auth_Service SHALL reject authentication and return an error
5. WHEN a creator accesses protected resources with a valid JWT token, THE System SHALL authorize the request
6. WHEN a creator accesses protected resources without a valid JWT token, THE System SHALL deny access and return an authentication error

### Requirement 2: Brand Management

**User Story:** As a creator, I want to manage my brand contacts, so that I can organize and track my business relationships.

#### Acceptance Criteria

1. WHEN a creator adds a new brand, THE System SHALL create a brand record with name, contact information, and notes
2. WHEN a creator views their brands list, THE System SHALL display all brands associated with their account
3. WHEN a creator updates brand information, THE System SHALL save the changes and update the modified timestamp
4. WHEN a creator attempts to create a brand without required fields, THE System SHALL prevent creation and return validation errors
5. THE System SHALL associate each brand exclusively with the creator who created it

### Requirement 3: Collaboration Tracking and Status Management

**User Story:** As a creator, I want to track my brand collaborations with status updates, so that I can monitor the progress of each deal.

#### Acceptance Criteria

1. WHEN a creator creates a new collaboration, THE System SHALL initialize it with Lead status and required details
2. WHEN a creator updates collaboration status, THE System SHALL validate the transition follows the defined workflow: Lead → Negotiating → Confirmed → InProduction → Posted → PaymentPending → Overdue → Paid → Closed
3. WHEN a collaboration reaches Posted status, THE System SHALL require a posting date to be recorded
4. WHEN a collaboration has all payments credited, THE System SHALL allow transition to Paid status
5. WHEN a collaboration deadline passes without posting, THE System SHALL flag it for creator attention
6. THE System SHALL track collaboration details including platform, deliverables, agreed amount, currency, and deadline

### Requirement 4: Payment Expectations and Credits Tracking

**User Story:** As a creator, I want to track expected payments and record actual payments received, so that I can monitor my income and identify overdue payments.

#### Acceptance Criteria

1. WHEN a creator adds a payment expectation, THE System SHALL record the expected amount, promised date, and payment method
2. WHEN a creator manually marks a payment as credited, THE System SHALL create a payment credit record with amount and date
3. WHEN a payment expectation's promised date passes without being credited, THE System SHALL mark it as overdue
4. WHEN partial payments are credited, THE System SHALL track the remaining balance on the payment expectation
5. WHEN a payment expectation is fully credited, THE System SHALL mark its status as completed
6. THE System SHALL support multiple payment expectations per collaboration

### Requirement 5: Conversation and Communication Logging

**User Story:** As a creator, I want to log conversations with brands, so that I can maintain a record of important communications.

#### Acceptance Criteria

1. WHEN a creator adds a conversation log entry, THE System SHALL record the channel, message content, and timestamp
2. WHEN a creator views a collaboration, THE System SHALL display all associated conversation logs in chronological order
3. WHEN a creator updates a conversation log, THE System SHALL preserve the original creation timestamp
4. THE System SHALL support multiple communication channels (email, social media, phone, in-person)
5. THE System SHALL associate conversation logs exclusively with their respective collaborations

### Requirement 6: File Attachment Management

**User Story:** As a creator, I want to upload and attach files to collaborations, so that I can keep contracts, briefs, and deliverables organized.

#### Acceptance Criteria

1. WHEN a creator uploads a file, THE System SHALL store it in the local filesystem and create an attachment record
2. WHEN a creator views a collaboration, THE System SHALL display all associated file attachments
3. WHEN a creator downloads an attachment, THE System SHALL serve the file from local storage
4. WHEN a creator uploads a file larger than the system limit, THE System SHALL reject the upload and return an error
5. THE System SHALL support common file types including documents, images, and videos
6. THE System SHALL associate file attachments exclusively with their respective collaborations

### Requirement 7: Dashboard and Financial Overview

**User Story:** As a creator, I want to see a financial dashboard, so that I can understand my earnings, pending payments, and business performance.

#### Acceptance Criteria

1. WHEN a creator accesses the dashboard, THE System SHALL display total expected earnings across all collaborations
2. WHEN calculating financial summaries, THE System SHALL include pending payment expectations and credited amounts
3. WHEN displaying overdue payments, THE System SHALL show all payment expectations past their promised dates
4. WHEN a creator views the dashboard, THE System SHALL show collaboration counts by status
5. THE System SHALL update dashboard calculations in real-time as data changes
6. THE System SHALL display financial data only for the authenticated creator's collaborations

### Requirement 8: Mobile-First User Interface

**User Story:** As a creator who primarily uses mobile devices, I want a mobile-optimized interface, so that I can efficiently manage my collaborations on the go.

#### Acceptance Criteria

1. WHEN a creator accesses the application on mobile, THE System SHALL display a responsive interface optimized for touch interaction
2. WHEN a creator performs actions, THE System SHALL provide large, easily tappable buttons and controls
3. WHEN a creator navigates the application, THE System SHALL minimize typing requirements through dropdowns and selections
4. WHEN a creator views lists and forms, THE System SHALL optimize layouts for mobile screen sizes
5. THE System SHALL maintain functionality and usability across mobile and desktop devices

### Requirement 9: Data Persistence and API Architecture

**User Story:** As a system administrator, I want reliable data persistence and well-structured APIs, so that the application maintains data integrity and supports future enhancements.

#### Acceptance Criteria

1. WHEN data is created or modified, THE System SHALL persist changes to the PostgreSQL database
2. WHEN API requests are made, THE System SHALL validate input data and return appropriate HTTP status codes
3. WHEN database schema changes are needed, THE System SHALL use Alembic migrations for version control
4. WHEN the application starts, THE System SHALL establish database connections and verify schema integrity
5. THE System SHALL implement proper error handling and logging for debugging and monitoring
6. THE System SHALL use SQLAlchemy ORM for database operations with proper relationship mapping

### Requirement 10: Development Environment and Deployment

**User Story:** As a developer, I want a consistent development environment, so that I can efficiently develop and test the application.

#### Acceptance Criteria

1. WHEN setting up the development environment, THE System SHALL provide Docker Compose configuration for PostgreSQL
2. WHEN running database migrations, THE System SHALL use Alembic to manage schema changes
3. WHEN starting the application, THE System SHALL provide clear instructions for both frontend and backend setup
4. WHEN developing locally, THE System SHALL support hot reloading for efficient development workflow
5. THE System SHALL maintain a monorepo structure with clear separation between frontend and backend code