---

## 📊 Analytics System Planning (Current - Planning Phase)

### Overview
This section outlines the comprehensive analytics system for the Protocol Review System. The analytics will track system performance, user behavior, data quality, and provide insights for decision-making.

### ✨ Recent Enhancements (Based on Stakeholder Feedback)

1. **🔑 KPI Prioritization**: Identified primary KPIs vs supporting metrics for stakeholder focus
2. **🚨 Enhanced Error Handling**: Added user-facing error trends and alerting mechanisms
3. **🔒 Data Governance**: Formalized data retention, anonymization, and privacy policies
4. **📊 Versioning Strategy**: Added schema and dashboard versioning for long-term maintenance
5. **📧 Enhanced Reports**: Role-based report templates with frequency controls
6. **💡 Future Ideas**: Added bonus features (anomaly detection, user journeys, sentiment analytics)
7. **🔐 Access Control Clarification**: Analytics Dashboard and Reports are Chairperson-only (not for Proponents/Reviewers)

### 🎯 Analytics Objectives

1. **System Performance Analytics**
   - Track analytics query performance
   - Monitor data aggregation efficiency
   - Measure dashboard load times
   - Track real-time update performance

2. **User Engagement Analytics**
   - Track which analytics are most viewed
   - Monitor user interaction with analytics dashboards
   - Track filter/date range usage patterns
   - Measure export/download frequency

3. **Data Quality Analytics**
   - Track data completeness metrics
   - Monitor missing or incomplete data points
   - Track data validation errors
   - Measure data freshness (last updated timestamps)

4. **Business Intelligence Analytics**
   - Protocol submission trends over time
   - Reviewer performance metrics
   - Review cycle time analytics
   - Approval/rejection rate trends
   - Research type distribution
   - Department/faculty submission patterns

5. **Analytics Usage Analytics (Meta-Analytics)**
   - Track which analytics dashboards are accessed most
   - Monitor analytics query patterns
   - Track analytics export/download frequency
   - Measure analytics refresh rates
   - Track user preferences for date ranges/filters

### 📋 Analytics Categories

#### 1. **Protocol Analytics**
- **Submission Metrics**
  - Total submissions (all time, monthly, yearly)
  - Submissions by status (pending, accepted, approved, archived, rejected)
  - Submission trends (line chart: submissions over time)
  - Submission rate (submissions per month/week)
  - Average time from draft to submission
  - Submission completion rate (% of drafts that become submissions)

- **Status Distribution**
  - Status breakdown (pie chart)
  - Status transitions over time
  - Average time in each status
  - Status change frequency

- **Research Type Analytics**
  - Submissions by research type (SR, PR, HO, BS, EX)
  - Research type distribution (pie/bar chart)
  - Average review time by research type
  - Approval rate by research type

- **Temporal Analytics**
  - Submissions by month/quarter/year
  - Seasonal patterns
  - Peak submission periods
  - Review cycle duration trends

#### 2. **Reviewer Analytics**
- **Performance Metrics**
  - Total assignments per reviewer
  - Completed assignments count
  - Pending assignments count
  - Overdue assignments count
  - Average completion time per reviewer
  - Completion rate per reviewer (%)
  - Reviewer workload distribution

- **Workload Analytics**
  - Active reviewers count
  - Average assignments per reviewer
  - Workload balance (standard deviation)
  - Reviewer capacity utilization
  - Overdue assignment trends

- **Quality Metrics**
  - Average review quality score (if available)
  - Reviewer response time
  - Reviewer engagement rate
  - Reviewer availability patterns

- **Comparative Analytics**
  - Reviewer performance comparison
  - Top performers
  - Reviewers needing support
  - Workload distribution fairness

#### 3. **Review Process Analytics**
- **Review Cycle Metrics**
  - Average review cycle time (submission to decision)
  - Review cycle time by research type
  - Review cycle time trends over time
  - Fastest/slowest review cycles
  - Bottleneck identification

- **Decision Analytics**
  - Approval rate (%)
  - Rejection rate (%)
  - Conditional approval rate
  - Average time to decision
  - Decision patterns by research type

- **Assessment Analytics**
  - Total assessments completed
  - Assessment completion rate
  - Average assessment time
  - Assessment type distribution
  - Incomplete assessments count

#### 4. **User Analytics (Proponent)**
- **Submission Behavior**
  - Submissions per proponent
  - Average submissions per proponent
  - Most active proponents
  - Draft abandonment rate
  - Submission success rate (draft → submitted)

- **Engagement Metrics**
  - Active proponents count
  - New proponents per period
  - Proponent retention rate
  - Average time to first submission
  - Proponent activity patterns

#### 5. **System Health Analytics**
- **Data Quality Metrics**
  - Missing data points count
  - Data completeness percentage
  - Data validation error rate
  - Stale data identification
  - Data consistency checks

- **Performance Metrics**
  - Analytics query execution time
  - Dashboard load time
  - Real-time update latency
  - Cache hit rate
  - API response times

- **Error Tracking**
  - Analytics calculation errors
  - Data fetch failures
  - Query timeout occurrences
  - Missing data warnings
  - **User-facing error trends**
    - Users affected by errors (last 7/30 days)
    - Error rate by user role
    - Error rate by feature/analytics dashboard
  - **Alerting Mechanism**
    - Email alerts for high error rates (>5% threshold)
    - System notifications for critical errors
    - Dashboard alerts for data quality issues
    - Configurable alert thresholds per metric

#### 6. **Meta-Analytics (Analytics About Analytics)**
- **Analytics Usage Tracking**
  - Most viewed analytics dashboards
  - Analytics page views per user role
  - Time spent on analytics pages
  - Analytics refresh frequency
  - Export/download frequency

- **Analytics Performance**
  - Analytics query performance
  - Slowest analytics queries
  - Analytics cache effectiveness
  - Analytics data freshness

- **User Preferences**
  - Most used date ranges
  - Most used filters
  - Preferred visualization types
  - Custom dashboard usage

### 🏗️ Technical Architecture

#### Data Collection Layer
- **Firestore Collections**
  - `analytics_events` - User interaction events
  - `analytics_metrics` - Pre-calculated metrics (cached)
  - `analytics_queries` - Query performance logs
  - `analytics_cache` - Cached analytics results

- **Real-time Tracking**
  - Track analytics page views
  - Track filter/date range changes
  - Track export/download actions
  - Track query execution times

#### Data Processing Layer
- **Analytics Service**
  - `analyticsService.ts` - Core analytics calculations
  - `analyticsCacheService.ts` - Caching layer
  - `analyticsQueryService.ts` - Query optimization
  - `analyticsEventService.ts` - Event tracking

- **Calculation Functions**
  - Protocol statistics calculation
  - Reviewer performance calculation
  - Review cycle time calculation
  - Trend analysis functions
  - Aggregation functions

#### Presentation Layer
- **Analytics Dashboard Components**
  - `analytics-dashboard.tsx` - Main dashboard
  - `protocol-analytics.tsx` - Protocol metrics
  - `reviewer-analytics.tsx` - Reviewer metrics
  - `review-process-analytics.tsx` - Review process metrics
  - `system-health-analytics.tsx` - System health metrics
  - `meta-analytics.tsx` - Analytics about analytics

- **Visualization Components**
  - Line charts (trends over time)
  - Bar charts (comparisons)
  - Pie charts (distributions)
  - Tables (detailed data)
  - KPI cards (key metrics)

#### Caching Strategy
- **Cache Levels**
  - Level 1: In-memory cache (React state)
  - Level 2: LocalStorage cache (browser)
  - Level 3: Firestore cache collection (server-side)
  - Cache invalidation: Time-based (5 min, 1 hour, 1 day)

- **Cache Keys**
  - `analytics:protocols:{dateRange}:{filters}`
  - `analytics:reviewers:{dateRange}:{filters}`
  - `analytics:review-process:{dateRange}:{filters}`

### 📊 Analytics Dashboard Structure

#### Main Analytics Dashboard (`/rec/analytics`)
**Access**: Chairperson only

- **Overview Section**
  - Key Performance Indicators (KPIs)
  - Quick stats cards
  - Recent activity summary
  - System health status

- **Protocol Analytics Tab**
  - Submission trends
  - Status distribution
  - Research type breakdown
  - Temporal patterns

- **Reviewer Analytics Tab**
  - Reviewer performance
  - Workload distribution
  - Completion rates
  - Comparative analysis

- **Review Process Analytics Tab**
  - Review cycle times
  - Decision patterns
  - Assessment completion
  - Bottleneck analysis

- **System Health Tab**
  - Data quality metrics
  - Performance metrics
  - Error tracking
  - Cache effectiveness

- **Meta-Analytics Tab** (Chairperson only)
  - Analytics usage patterns
  - Query performance
  - User preferences
  - System optimization insights

### 🔍 Analytics Features

#### 1. **Date Range Filtering**
- Predefined ranges: Today, Last 7 days, Last 30 days, Last 3 months, Last 6 months, Last year, All time
- Custom date range picker
- Compare periods (e.g., this month vs last month)

#### 2. **Filtering Options**
- Filter by research type
- Filter by status
- Filter by reviewer
- Filter by proponent
- Filter by department/faculty
- Filter by date range

#### 3. **Export Functionality**
- Export to CSV
- Export to PDF (charts and tables)
- Export to Excel
- **Scheduled Reports (Enhanced)**
  - **Access**: Chairperson only
  - Frequency controls: Daily, Weekly, Monthly, Quarterly
  - Report templates:
    - **KPI Summary Report**: Key performance indicators overview
    - **Reviewer Performance Report**: Reviewer metrics and workload
    - **Protocol Status Report**: Protocol status breakdown and trends
    - **System Health Report**: System performance and data quality metrics
    - **Full Analytics Report**: Complete analytics dashboard export
  - Custom report builder (select metrics to include)
  - Email delivery with configurable recipients
  - Report archive/history
  - **Note**: Reports are for Chairperson management use only. Proponents and Reviewers do not receive analytics reports - they see their own data in their regular dashboards.

#### 4. **Real-time Updates**
- Live data updates (using Firestore real-time listeners)
- Auto-refresh options (manual, 30s, 1min, 5min)
- Update indicators

#### 5. **Drill-down Capabilities**
- Click on charts to see detailed data
- Navigate to related records
- Filter by clicking on data points

### 🔑 Key Performance Indicators (KPIs) vs Supporting Metrics

#### Primary KPIs (Stakeholder-Focused)
These are the metrics that stakeholders care most about and should be prominently displayed:

**Protocol KPIs:**
- 🔑 **Average time from draft to approval** - Critical for measuring efficiency
- 🔑 **Total protocols approved this period** - Business outcome metric
- 🔑 **Approval rate** - Success indicator
- 🔑 **Average review cycle time** - Process efficiency
- 🔑 **Protocols pending review** - Current workload indicator

**Reviewer KPIs:**
- 🔑 **Average reviewer completion time** - Performance benchmark
- 🔑 **Reviewer workload balance** - Fairness indicator
- 🔑 **Overdue assignments count** - Risk indicator

**System KPIs:**
- 🔑 **Data completeness percentage** - Data quality indicator
- 🔑 **Average dashboard load time** - User experience metric
- 🔑 **Error rate** - System reliability

#### Supporting Metrics (Detailed Analysis)
These provide context and deeper insights but are secondary to KPIs:

### 📈 Key Metrics to Track

#### Protocol Metrics
- [ ] 🔑 Total protocols (all time) - **KPI**
- [ ] Protocols by status
- [ ] 🔑 Submission rate (per month) - **KPI**
- [ ] Average time in each status
- [ ] Research type distribution
- [ ] Submission trends (line chart)
- [ ] Status transition timeline
- [ ] 🔑 Average time from draft to approval - **PRIMARY KPI**

#### Reviewer Metrics
- [ ] Total reviewers (active/inactive)
- [ ] Total assignments
- [ ] Completed assignments
- [ ] 🔑 Overdue assignments - **KPI**
- [ ] 🔑 Average completion time - **PRIMARY KPI**
- [ ] Completion rate
- [ ] 🔑 Workload distribution - **KPI**
- [ ] Reviewer performance ranking

#### Review Process Metrics
- [ ] 🔑 Average review cycle time - **PRIMARY KPI**
- [ ] Review cycle time by research type
- [ ] 🔑 Approval rate - **PRIMARY KPI**
- [ ] Rejection rate
- [ ] Average time to decision
- [ ] Assessment completion rate

#### User Engagement Metrics
- [ ] Analytics page views
- [ ] Most viewed analytics
- [ ] Export/download count
- [ ] Filter usage patterns
- [ ] Date range preferences

#### System Health Metrics
- [ ] 🔑 Data completeness % - **KPI**
- [ ] Query performance (avg time)
- [ ] Cache hit rate
- [ ] 🔑 Error rate - **KPI**
- [ ] Data freshness
- [ ] User-facing error trends (users affected in last 7 days)
- [ ] Error alerting mechanism (email/system notifications)

### 🛠️ Implementation Plan

#### Phase 1: Foundation (Week 1-2)
- [ ] Create analytics service structure
- [ ] Set up analytics data types/interfaces
- [ ] Create base analytics calculation functions
- [ ] Set up analytics cache service
- [ ] Create analytics event tracking

#### Phase 2: Core Analytics (Week 3-4)
- [ ] Implement protocol analytics
- [ ] Implement reviewer analytics
- [ ] Implement review process analytics
- [ ] Create analytics dashboard layout (Chairperson only)
- [ ] Add date range and filter components
- [ ] Implement access control (Chairperson-only access)

#### Phase 3: Visualization (Week 5-6)
- [ ] Integrate chart library (recharts/chart.js)
- [ ] Create visualization components
- [ ] Add KPI cards
- [ ] Create drill-down functionality
- [ ] Add export functionality

#### Phase 4: Advanced Features (Week 7-8)
- [ ] Implement meta-analytics
- [ ] Add system health monitoring
- [ ] Create scheduled reports with role-based templates
- [ ] Add comparison features
- [ ] Implement error alerting mechanism
- [ ] Add data governance framework
- [ ] Implement analytics versioning system
- [ ] Optimize performance

#### Phase 5: Testing & Optimization (Week 9-10)
- [ ] Performance testing
- [ ] Cache optimization
- [ ] Query optimization
- [ ] User testing
- [ ] KPI validation with stakeholders
- [ ] Data governance compliance review
- [ ] Documentation

#### Phase 6: Future Enhancements (Optional - Post MVP)
- [ ] Anomaly detection implementation
- [ ] User journey analytics
- [ ] Sentiment analytics
- [ ] Predictive analytics
- [ ] Comparative benchmarking

### 📝 Files to Create/Modify

#### New Files
- `src/lib/services/analytics/analyticsService.ts`
- `src/lib/services/analytics/analyticsCacheService.ts`
- `src/lib/services/analytics/analyticsQueryService.ts`
- `src/lib/services/analytics/analyticsEventService.ts`
- `src/lib/services/analytics/analyticsAlertService.ts` - Error alerting
- `src/lib/services/analytics/analyticsVersioningService.ts` - Version control
- `src/lib/services/analytics/reportService.ts` - Scheduled reports
- `src/lib/services/analytics/dataGovernanceService.ts` - Data governance
- `src/types/analytics.types.ts`
- `src/types/analytics-kpi.types.ts` - KPI definitions
- `src/app/rec/analytics/page.tsx`
- `src/components/rec/analytics/analytics-dashboard.tsx`
- `src/components/rec/analytics/protocol-analytics.tsx`
- `src/components/rec/analytics/reviewer-analytics.tsx`
- `src/components/rec/analytics/review-process-analytics.tsx`
- `src/components/rec/analytics/system-health-analytics.tsx`
- `src/components/rec/analytics/meta-analytics.tsx`
- `src/components/rec/analytics/analytics-filters.tsx`
- `src/components/rec/analytics/analytics-date-range.tsx`
- `src/components/rec/analytics/kpi-card.tsx`
- `src/components/rec/analytics/kpi-dashboard.tsx` - KPI-focused view
- `src/components/rec/analytics/report-builder.tsx` - Custom report builder (Chairperson only)
- `src/components/rec/analytics/error-alerts.tsx` - Error alerting UI
- `src/hooks/useAnalytics.ts`
- `src/hooks/useAnalyticsCache.ts`
- `src/hooks/useAnalyticsKPIs.ts` - KPI-specific hook

#### Modified Files
- `src/components/rec/chairperson/components/navbar/app-sidebar.tsx` - Add Analytics link (Chairperson only)
- `src/middleware.ts` or auth middleware - Add analytics route protection (Chairperson only)
- `src/types/index.ts` - Export analytics types
- `TASKING.md` - This file (tracking progress)

### 🔐 Permissions & Access Control

#### Analytics Dashboard Access
- **Chairperson**: ✅ Full analytics dashboard access
  - All protocol analytics
  - Reviewer performance analytics
  - Review process analytics
  - System health monitoring
  - Meta-analytics
- **Proponent**: ❌ No analytics dashboard access
  - See own submissions in regular dashboard only
- **Reviewer**: ❌ No analytics dashboard access
  - See own assignments in regular dashboard only

**Rationale**: Analytics dashboard is for management oversight and decision-making. Only chairperson needs access to system-wide analytics.

#### Reports Access
- **Chairperson**: ✅ Full reports access
  - Scheduled reports (KPI summaries, reviewer performance, protocol status, system health)
  - Custom report builder
  - Email delivery
- **Proponent**: ❌ No reports access
  - See own submission status in regular dashboard
- **Reviewer**: ❌ No reports access
  - See own assignments in regular dashboard

**Rationale**: Reports are management tools for chairperson oversight. Proponents and reviewers see their own data in their regular dashboards, not through analytics reports.

### 📊 Data Sources

- **Firestore Collections**:
  - `submissions` - Protocol data
  - `reviewers` - Reviewer data
  - `assessment_forms` - Assessment data
  - `decision` - Decision data
  - `messages` - Communication data

- **Calculated Fields**:
  - Review cycle time (calculated from timestamps)
  - Completion rates (calculated from status)
  - Trends (aggregated over time)

### 🎨 UI/UX Considerations

- **Responsive Design**: Mobile, tablet, desktop
- **Loading States**: Skeleton loaders, progress indicators
- **Error Handling**: Graceful error messages
- **Empty States**: Helpful messages when no data
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Lazy loading, virtualization for large datasets

### 📚 Dependencies to Add

- Chart library: `recharts` or `chart.js` with `react-chartjs-2`
- Date utilities: `date-fns` (already in use)
- Export: `xlsx` for Excel, `jspdf` for PDF
- Performance: `react-window` for virtualization (if needed)

### 🔒 Data Governance

#### Data Retention Policies
- **Analytics Events**: Retain for 2 years, then archive
- **Analytics Metrics Cache**: Retain for 1 year
- **Query Performance Logs**: Retain for 6 months
- **User Interaction Events**: Retain for 1 year, then anonymize
- **Scheduled Reports**: Retain for 3 years

#### Data Anonymization & Pseudonymization
- User IDs in analytics: Use pseudonymized identifiers
- Personal information: Exclude from analytics (or fully anonymize)
- Reviewer names: Optional anonymization for comparative analytics
- Proponent data: Aggregate only, no individual tracking without consent

#### Consent & Privacy
- **Analytics Tracking Consent**: 
  - Explicit opt-in for detailed user behavior tracking
  - System analytics (performance, errors) - no consent needed
  - User engagement analytics - require consent
- **Data Access Controls**: Role-based access to analytics data
- **GDPR/Privacy Compliance**: 
  - Right to access analytics data about self
  - Right to deletion of personal analytics data
  - Data export capabilities

#### Data Quality Standards
- Minimum data completeness threshold: 95%
- Data validation rules for analytics calculations
- Data freshness requirements: Max 24 hours old for real-time metrics
- Data consistency checks: Automated validation on data ingestion

### 📊 Analytics Versioning

#### Schema Versioning
- **Version Control**: Track analytics schema versions (v1, v2, etc.)
- **Backward Compatibility**: Maintain support for previous schema versions
- **Migration Strategy**: 
  - Versioned collections: `analytics_metrics_v1`, `analytics_metrics_v2`
  - Migration scripts for data transformation
  - Changelog documentation for schema changes

#### Dashboard Versioning
- **Dashboard Versions**: Track dashboard layout/configuration versions
- **A/B Testing**: Support for testing different dashboard layouts
- **User Preferences**: Save user's preferred dashboard version
- **Rollback Capability**: Ability to revert to previous dashboard version

#### Calculation Versioning
- **Calculation Logic Versions**: Version control for analytics calculations
- **Formula Changes**: Document changes to calculation formulas
- **Historical Comparisons**: Ability to compare metrics using different calculation versions
- **Changelog**: Maintain changelog of calculation changes

### ⚠️ Considerations

1. **Performance**: Large datasets may require pagination or aggregation
2. **Privacy**: Ensure user data privacy in analytics (see Data Governance section)
3. **Real-time**: Balance real-time updates with performance
4. **Caching**: Implement smart caching to reduce Firestore reads
5. **Scalability**: Design for future growth in data volume
6. **Versioning**: Plan for schema and dashboard evolution (see Analytics Versioning section)
7. **Error Handling**: Implement comprehensive error tracking and alerting (see Error Tracking section)

### 🎯 Success Metrics

- Analytics dashboard load time < 2 seconds
- Query execution time < 1 second (cached)
- Cache hit rate > 80%
- User engagement: > 50% of users access analytics monthly
- Data completeness > 95%

---

### 💡 Bonus Ideas (Future Phases - Optional)

#### 1. **Anomaly Detection**
- **Purpose**: Flag unusual patterns automatically
- **Use Cases**:
  - Unusual spikes in protocol rejections
  - Reviewer delays beyond normal patterns
  - Sudden drops in submission rates
  - Data quality anomalies
- **Implementation**:
  - Basic ML algorithms (statistical outlier detection)
  - Threshold-based alerts
  - Trend deviation analysis
  - Pattern recognition for recurring anomalies

#### 2. **User Journey Analytics**
- **Purpose**: Track complete user workflows for UX optimization
- **Metrics**:
  - Sequence of actions from submission to decision
  - Time spent in each step
  - Drop-off points in workflows
  - Most common navigation paths
  - Feature usage patterns
- **Visualization**:
  - User journey flowcharts
  - Heatmaps of user interactions
  - Conversion funnel analysis
  - Path analysis diagrams

#### 3. **Sentiment Analytics**
- **Purpose**: Analyze communication sentiment for insights
- **Data Sources**:
  - Message logs between reviewers and proponents
  - Feedback forms (if implemented)
  - Comment sections in assessments
- **Metrics**:
  - Overall sentiment score (positive/neutral/negative)
  - Sentiment trends over time
  - Sentiment by communication type
  - Correlation between sentiment and outcomes
- **Use Cases**:
  - Identify communication issues early
  - Measure reviewer-proponent relationship quality
  - Track satisfaction trends

#### 4. **Predictive Analytics** (Advanced)
- **Purpose**: Forecast future trends and outcomes
- **Predictions**:
  - Expected submission volumes
  - Review cycle time predictions
  - Reviewer workload forecasting
  - Approval probability estimates
- **Implementation**:
  - Time series forecasting
  - Regression models
  - Historical pattern analysis

#### 5. **Comparative Benchmarking**
- **Purpose**: Compare performance against industry standards
- **Metrics**:
  - Review cycle times vs. industry averages
  - Approval rates vs. similar institutions
  - Reviewer workload vs. recommended standards
- **Data Sources**:
  - Industry reports (if available)
  - Historical internal benchmarks
  - Peer institution comparisons (if data sharing agreements exist)

---

**Status**: 📋 Planning Phase - Enhanced with stakeholder feedback
**Last Updated**: Current Date
**Enhancements Added**:
- ✅ KPI identification and prioritization
- ✅ Enhanced error handling with user-facing trends and alerting
- ✅ Data governance framework
- ✅ Analytics versioning strategy
- ✅ Enhanced scheduled reports with role-based templates
- ✅ Bonus ideas for future phases
