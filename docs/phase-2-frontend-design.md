# Phase 2 Frontend Design & UI/UX Specification

**Date:** 2025-10-16
**Version:** 1.0
**Status:** Ready for Implementation

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [User Personas & Flows](#user-personas--flows)
3. [Information Architecture](#information-architecture)
4. [Component Library](#component-library)
5. [Page Designs & Mockups](#page-designs--mockups)
6. [State Management Architecture](#state-management-architecture)
7. [Accessibility & Responsive Design](#accessibility--responsive-design)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Design Philosophy

### Core Principles

1. **Role-Adaptive Interface**
   - UI dynamically adapts based on user permissions
   - Progressive disclosure: Show only what users can access
   - Consistent experience across roles with contextual differences

2. **Progressive Enhancement**
   - Core functionality works without JavaScript
   - Enhanced features for modern browsers
   - Graceful degradation for older browsers

3. **Performance First**
   - Lazy load components and routes
   - Optimistic UI updates
   - Background data fetching with React Query
   - Skeleton loaders for perceived performance

4. **Accessibility by Default**
   - WCAG 2.1 AA compliance
   - Keyboard navigation throughout
   - Screen reader friendly
   - High contrast mode support

5. **Mobile-First Responsive**
   - Design for mobile, enhance for desktop
   - Touch-friendly targets (44×44px minimum)
   - Responsive typography and spacing

### Design System

**Color Palette:**
```css
/* Primary Colors */
--primary-50:  #E3F2FD;   /* Light backgrounds */
--primary-100: #BBDEFB;
--primary-500: #2196F3;   /* Primary actions */
--primary-700: #1976D2;   /* Primary hover */
--primary-900: #0D47A1;   /* Primary active */

/* Secondary Colors */
--secondary-500: #FF6F00; /* Accent, CTAs */
--secondary-700: #E65100;

/* Semantic Colors */
--success-500: #4CAF50;   /* Success states */
--warning-500: #FF9800;   /* Warnings */
--error-500: #F44336;     /* Errors, destructive */
--info-500: #2196F3;      /* Information */

/* Neutral Colors */
--gray-50:  #FAFAFA;      /* Background */
--gray-100: #F5F5F5;      /* Subtle backgrounds */
--gray-300: #E0E0E0;      /* Borders */
--gray-500: #9E9E9E;      /* Disabled text */
--gray-700: #616161;      /* Secondary text */
--gray-900: #212121;      /* Primary text */

/* Role-Specific Colors */
--role-owner: #9C27B0;    /* Purple */
--role-admin: #F44336;    /* Red */
--role-provider: #2196F3; /* Blue */
--role-client: #4CAF50;   /* Green */
--role-support: #FF9800;  /* Orange */
```

**Typography:**
```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;

/* Font Sizes (Fluid Typography) */
--text-xs:   clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);   /* 12-14px */
--text-sm:   clamp(0.875rem, 0.8rem + 0.3vw, 1rem);       /* 14-16px */
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);     /* 16-18px */
--text-lg:   clamp(1.125rem, 1rem + 0.5vw, 1.25rem);      /* 18-20px */
--text-xl:   clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);      /* 20-24px */
--text-2xl:  clamp(1.5rem, 1.3rem + 0.8vw, 2rem);         /* 24-32px */
--text-3xl:  clamp(2rem, 1.7rem + 1vw, 2.5rem);           /* 32-40px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

**Spacing Scale:**
```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

**Border Radius:**
```css
--radius-sm: 0.25rem;  /* 4px - Buttons, inputs */
--radius-md: 0.5rem;   /* 8px - Cards, modals */
--radius-lg: 1rem;     /* 16px - Large cards */
--radius-full: 9999px; /* Pills, avatars */
```

**Shadows:**
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## User Personas & Flows

### Persona 1: Sarah (Owner/Admin)
**Role:** Salon Owner
**Goals:** Manage team, configure roles, view analytics
**Tech Savvy:** Medium
**Frequency:** Daily

**Key Flows:**
1. View business dashboard (appointments, revenue, utilization)
2. Assign roles to new employees
3. Create custom roles for specific permissions
4. Review audit logs
5. Manage waitlist manually (promote/reject entries)
6. Configure group booking rules

### Persona 2: Mike (Provider)
**Role:** Hair Stylist
**Goals:** Manage schedule, see appointments, set availability
**Tech Savvy:** Low-Medium
**Frequency:** Multiple times daily

**Key Flows:**
1. View today's appointments
2. Set weekly availability
3. Block time off
4. Accept/decline group booking invitations
5. View waitlist for their calendar
6. Update appointment status

### Persona 3: Jessica (Client)
**Role:** Regular Customer
**Goals:** Book appointments, manage bookings, join waitlist
**Tech Savvy:** Medium
**Frequency:** Weekly

**Key Flows:**
1. Search for available appointments
2. Book appointment with favorite provider
3. Join waitlist when no slots available
4. Receive notification when promoted
5. Cancel/reschedule appointment
6. View booking history

### Persona 4: Tom (Support)
**Role:** Customer Support Agent
**Goals:** Help customers, resolve issues, view data
**Tech Savvy:** High
**Frequency:** Daily

**Key Flows:**
1. Search for user appointments
2. Help user rebook/cancel
3. View audit logs for debugging
4. Manage waitlist on behalf of users
5. View system metrics

---

## Information Architecture

### Site Map

```
┌─────────────────────────────────────────────────────────────┐
│                         Root (/)                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬────────────────┐
        │                     │              │                │
    ┌───▼────┐          ┌─────▼─────┐  ┌────▼────┐      ┌────▼────┐
    │ Public │          │   Auth    │  │  User   │      │  Admin  │
    │ Pages  │          │   Pages   │  │  Pages  │      │  Pages  │
    └───┬────┘          └─────┬─────┘  └────┬────┘      └────┬────┘
        │                     │              │                │
    ┌───▼───────────┐   ┌─────▼─────┐  ┌────▼─────────────────────┐
    │ - Home        │   │ - Login   │  │ - Dashboard              │
    │ - About       │   │ - Register│  │ - Appointments           │
    │ - Pricing     │   │ - Forgot  │  │   ├─ List               │
    │ - Contact     │   │   Password│  │   ├─ New Booking        │
    └───────────────┘   └───────────┘  │   ├─ Details            │
                                        │   └─ Reschedule         │
                                        │ - Availability (Provider)│
                                        │   ├─ Weekly View        │
                                        │   └─ Block Time         │
                                        │ - Waitlist              │
                                        │   ├─ My Entries         │
                                        │   └─ Join Waitlist      │
                                        │ - Profile               │
                                        │   ├─ Settings           │
                                        │   └─ Notifications      │
                                        └──────────────────────────┘

                                        ┌─────────────────────────┐
                                        │ - Roles & Permissions   │
                                        │   ├─ Role List          │
                                        │   ├─ Create Role        │
                                        │   ├─ Edit Role          │
                                        │   └─ Assign Roles       │
                                        │ - Audit Logs            │
                                        │ - Analytics             │
                                        │ - Team Management       │
                                        │ - Group Bookings        │
                                        │   ├─ Create Group       │
                                        │   └─ Manage Group       │
                                        └─────────────────────────┘
```

### Navigation Structure

**Primary Navigation (All Users):**
```
┌─────────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Appointments] [Waitlist] ... [Profile▾] │
└─────────────────────────────────────────────────────────────┘
```

**Role-Specific Navigation:**

**Client:**
- Dashboard (upcoming appointments)
- Book Appointment
- My Appointments
- Waitlist
- Profile

**Provider:**
- Dashboard (today's schedule)
- My Calendar
- Availability
- Appointments
- Waitlist (my calendar)
- Profile

**Admin:**
- Dashboard (analytics)
- Appointments (all)
- Team
- Roles & Permissions
- Group Bookings
- Audit Logs
- Settings
- Profile

---

## Component Library

### 1. Core UI Components

#### Button Component
```jsx
/**
 * Button Component
 * Variants: primary, secondary, danger, ghost, link
 * Sizes: sm, md, lg
 * States: default, hover, active, disabled, loading
 */

<Button
  variant="primary"
  size="md"
  loading={false}
  disabled={false}
  leftIcon={<IconCheck />}
  rightIcon={null}
  onClick={() => {}}
>
  Button Text
</Button>
```

**Visual Specs:**
```css
/* Primary Button */
.button-primary {
  background: var(--primary-500);
  color: white;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-sm);
  font-weight: var(--font-semibold);
  transition: all 150ms ease;
}

.button-primary:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.button-primary:disabled {
  background: var(--gray-300);
  color: var(--gray-500);
  cursor: not-allowed;
}

/* Size Variants */
.button-sm { padding: var(--spacing-2) var(--spacing-4); font-size: var(--text-sm); }
.button-md { padding: var(--spacing-3) var(--spacing-6); font-size: var(--text-base); }
.button-lg { padding: var(--spacing-4) var(--spacing-8); font-size: var(--text-lg); }
```

#### Badge Component (Role Indicators)
```jsx
/**
 * Badge Component
 * Used for: Role labels, status indicators
 */

<Badge variant="owner" size="md">Owner</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

**Visual Design:**
```
┌──────────────────────────────────────────────────┐
│ Owner      Admin      Provider    Client         │
│ [Purple]   [Red]      [Blue]      [Green]        │
│                                                   │
│ Active     Pending    Cancelled   Confirmed      │
│ [Green]    [Orange]   [Red]       [Blue]         │
└──────────────────────────────────────────────────┘
```

#### Card Component
```jsx
/**
 * Card Component
 * Used for: Appointment cards, user cards, dashboard widgets
 */

<Card
  variant="default"
  padding="md"
  hoverable={true}
  onClick={() => {}}
>
  <CardHeader>
    <CardTitle>Appointment with Sarah</CardTitle>
    <CardActions>
      <IconButton icon={<IconEdit />} />
    </CardActions>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </CardFooter>
</Card>
```

#### Modal Component
```jsx
/**
 * Modal Component
 * Sizes: sm (400px), md (600px), lg (800px), xl (1200px), full
 */

<Modal
  isOpen={true}
  onClose={() => {}}
  size="md"
  title="Assign Role"
  description="Select a role to assign to this user"
>
  <ModalBody>
    Content
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onSubmit}>Confirm</Button>
  </ModalFooter>
</Modal>
```

#### Permission Gate Component
```jsx
/**
 * Permission Gate
 * Only renders children if user has required permissions
 */

<PermissionGate
  permissions={['appointments:create']}
  mode="all"  // or "any"
  fallback={<AccessDenied />}
>
  <Button>Create Appointment</Button>
</PermissionGate>
```

### 2. Domain-Specific Components

#### Appointment Card
```
┌─────────────────────────────────────────────────┐
│ 🗓️  Haircut Appointment                [Edit▾]  │
│                                                  │
│ 📅 Monday, Nov 1, 2025                          │
│ ⏰ 2:00 PM - 3:00 PM (1 hour)                   │
│ 👤 Provider: Sarah Johnson                      │
│ 📍 Downtown Salon                                │
│                                                  │
│ Status: [Confirmed ✓]                           │
│                                                  │
│ ┌────────────┐  ┌──────────────┐               │
│ │ Reschedule │  │    Cancel    │               │
│ └────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────┘
```

#### Role Assignment Card
```
┌─────────────────────────────────────────────────┐
│ 👤 John Doe                          [Active ✓] │
│    john.doe@example.com                          │
│                                                  │
│ Current Roles:                                   │
│ ┌──────────┐ ┌──────────┐                       │
│ │ Provider │ │  Admin   │  [+ Assign Role]     │
│ └─────┬────┘ └────┬─────┘                       │
│       │           │                              │
│    [×Remove]   [×Remove]                        │
│                                                  │
│ Last Login: 2 hours ago                          │
│ Member Since: Jan 2025                           │
└─────────────────────────────────────────────────┘
```

#### Waitlist Entry Card
```
┌─────────────────────────────────────────────────┐
│ 🕐 Waitlist Entry #1234                         │
│                                                  │
│ Preferred Time: Nov 1-7, 2025                   │
│ ⏰ Between 2:00 PM - 5:00 PM                    │
│ 📅 Duration: 1 hour                             │
│ 👤 Provider: Sarah Johnson                      │
│                                                  │
│ Priority: High • Position: #3 in queue          │
│ Auto-book: [Enabled ✓]                          │
│                                                  │
│ Status: [Active 🟢]                             │
│                                                  │
│ Added: 2 days ago                                │
│ Expires: In 5 days                               │
│                                                  │
│ [Cancel Waitlist Entry]                         │
└─────────────────────────────────────────────────┘
```

#### Group Appointment Card
```
┌─────────────────────────────────────────────────┐
│ 👥 Team Planning Workshop            [Pending]  │
│                                                  │
│ 📅 Monday, Nov 1, 2025                          │
│ ⏰ 10:00 AM - 12:00 PM (2 hours)                │
│                                                  │
│ Participants (3 of 5):                           │
│ ┌───────────────────────────────────┐           │
│ │ ✓ Sarah (Provider)   [Confirmed]  │           │
│ │ ✓ Mike (Provider)    [Confirmed]  │           │
│ │ ? Tom (Client)       [Pending]    │           │
│ └───────────────────────────────────┘           │
│                                                  │
│ [+ Add Participant]                              │
│                                                  │
│ Status: Waiting for confirmations               │
│ Deadline: Oct 28, 2025 at 11:59 PM             │
│                                                  │
│ ┌────────────┐  ┌──────────────┐               │
│ │   Remind   │  │    Cancel    │               │
│ └────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────┘
```

---

## Page Designs & Mockups

### 1. Dashboard (Client View)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Book Appointment] [Waitlist] ... [JD▾]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Welcome back, Jessica! 👋                                   │
│  You have 2 upcoming appointments                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📅 NEXT APPOINTMENT                                     │ │
│  │                                                          │ │
│  │ Haircut with Sarah Johnson                              │ │
│  │ Tomorrow, Nov 1 at 2:00 PM                              │ │
│  │                                                          │ │
│  │ [View Details]  [Reschedule]  [Cancel]                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │ 🎯 QUICK ACTIONS          │  │ 🕐 WAITLIST STATUS      │ │
│  │                           │  │                          │ │
│  │ [Book New Appointment]    │  │ You're on 1 waitlist    │ │
│  │ [View All Appointments]   │  │                          │ │
│  │ [Join Waitlist]           │  │ Position: #3            │ │
│  │                           │  │ For: Sarah's Calendar   │ │
│  └──────────────────────────┘  │                          │ │
│                                 │ [View Details]          │ │
│  ┌──────────────────────────┐  └─────────────────────────┘ │
│  │ 📊 YOUR ACTIVITY          │                              │
│  │                           │                              │
│  │ Appointments this month: 3│                              │
│  │ Completed: 2              │                              │
│  │ Upcoming: 1               │                              │
│  └──────────────────────────┘                              │
│                                                               │
│  UPCOMING APPOINTMENTS                          [View All →] │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Nov 1, 2:00 PM • Haircut • Sarah Johnson   [Confirmed] │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Nov 8, 3:00 PM • Color • Mike Davis         [Confirmed] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2. Dashboard (Provider View)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Calendar] [Appointments] ...  [MJ▾]      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Good morning, Mike! 🌅                                      │
│  You have 6 appointments today                               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📅 TODAY'S SCHEDULE         Nov 1, 2025   [View Week] │ │
│  │                                                          │ │
│  │ 9:00 AM  [■■■■■■■] Jessica Smith - Haircut   (1h)     │ │
│  │ 10:00 AM [□□□□□□□] Available                           │ │
│  │ 11:00 AM [■■■■■■■] Tom Wilson - Color       (1.5h)    │ │
│  │ 12:30 PM [......] Lunch Break                          │ │
│  │ 1:30 PM  [■■■■■■■] Sarah Lee - Highlights    (2h)     │ │
│  │ 3:30 PM  [■■■■■■■] David Brown - Haircut     (1h)     │ │
│  │ 4:30 PM  [□□□□□□□] Available                           │ │
│  │ 5:30 PM  [■■■■■■■] Emma Davis - Styling      (1h)     │ │
│  │                                                          │ │
│  │ Utilization: 75% (6 of 8 hours booked)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │ ⏰ NEXT APPOINTMENT       │  │ 🕐 WAITLIST (My Cal)    │ │
│  │                           │  │                          │ │
│  │ Jessica Smith             │  │ 5 people waiting        │ │
│  │ 9:00 AM (in 15 minutes)   │  │                          │ │
│  │                           │  │ Next: John Doe          │ │
│  │ Service: Haircut          │  │ Preferred: Today 4-6 PM │ │
│  │ Duration: 1 hour          │  │                          │ │
│  │                           │  │ [View All]  [Promote]   │ │
│  │ [Start Appointment]       │  └─────────────────────────┘ │
│  └──────────────────────────┘                              │
│                                                               │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │ 👥 GROUP INVITATIONS (2)  │  │ 📊 THIS WEEK            │ │
│  │                           │  │                          │ │
│  │ Team Workshop             │  │ Appointments: 28        │ │
│  │ Nov 5, 10 AM - 12 PM      │  │ Hours Booked: 42        │ │
│  │                           │  │ Revenue: $1,680         │ │
│  │ [Accept]     [Decline]    │  │ Avg Rating: 4.8 ⭐      │ │
│  └──────────────────────────┘  └─────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3. Dashboard (Admin View)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Team] [Roles] [Analytics] [Audit] [SD▾]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Business Overview 📊                        Week of Nov 1   │
│                                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 📅 BOOKINGS  │ │ 💰 REVENUE   │ │ 👥 TEAM      │        │
│  │              │ │              │ │              │        │
│  │     142      │ │   $5,680     │ │      8       │        │
│  │  ↑ 12% WoW   │ │  ↑ 8% WoW    │ │  Active      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 📈 UTILIZATION││ 🕐 WAITLIST  │ │ ⚠️  ALERTS   │        │
│  │              │ │              │ │              │        │
│  │     78%      │ │     23       │ │      2       │        │
│  │  ↑ 5% WoW    │ │  Entries     │ │  New Issues  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📊 REVENUE TREND (Last 30 Days)                        │ │
│  │                                                          │ │
│  │     $2k ┼                                      ╭──      │ │
│  │         │                            ╭────────╯         │ │
│  │     $1k ┼                   ╭───────╯                  │ │
│  │         │          ╭────────╯                          │ │
│  │      $0 ┼─────────╯                                    │ │
│  │         └────────────────────────────────────────────  │ │
│  │         Oct 1    Oct 10    Oct 20    Oct 30    Nov 1  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 👥 TEAM PERFORMANCE                          [View All] │ │
│  │                                                          │ │
│  │ Sarah Johnson    | 34 bookings | 95% rating | $1,360  │ │
│  │ Mike Davis       | 28 bookings | 92% rating | $1,120  │ │
│  │ Emma Wilson      | 25 bookings | 94% rating | $1,000  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │ 🚨 ACTION REQUIRED        │  │ 📋 RECENT ACTIVITY      │ │
│  │                           │  │                          │ │
│  │ • 3 waitlist entries      │  │ • John assigned         │ │
│  │   expiring today          │  │   'provider' role       │ │
│  │ • 2 group invitations     │  │ • Sarah updated         │ │
│  │   pending                 │  │   availability          │ │
│  │ • 1 audit alert           │  │ • Mike cancelled        │ │
│  │                           │  │   appointment           │ │
│  └──────────────────────────┘  └─────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4. Role Management Page (Admin)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Team] [Roles] [Analytics] [Audit] [SD▾]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ← Back to Team                                               │
│                                                               │
│  Roles & Permissions 🔐                    [+ Create Role]   │
│                                                               │
│  Manage roles and permissions for your organization          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [All Roles] [System Roles] [Custom Roles]              │ │
│  │                                                          │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ 👑 Owner                            [System Role]   │ │ │
│  │ │                                                      │ │ │
│  │ │ Full access to all features and settings            │ │ │
│  │ │                                                      │ │ │
│  │ │ Permissions: All permissions                         │ │ │
│  │ │ Users: 1                                             │ │ │
│  │ │                                                      │ │ │
│  │ │ [View Details]                      [Cannot Edit]   │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ 🔧 Admin                            [System Role]   │ │ │
│  │ │                                                      │ │ │
│  │ │ Manage team, roles, and business settings            │ │ │
│  │ │                                                      │ │ │
│  │ │ Permissions: users:*, roles:*, appointments:read:all │ │ │
│  │ │ Users: 2                                             │ │ │
│  │ │                                                      │ │ │
│  │ │ [View Details]                      [Cannot Edit]   │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ 💼 Provider                         [System Role]   │ │ │
│  │ │                                                      │ │ │
│  │ │ Manage own calendar and appointments                 │ │ │
│  │ │                                                      │ │ │
│  │ │ Permissions: calendars:*, availability:*, ...        │ │ │
│  │ │ Users: 5                                             │ │ │
│  │ │                                                      │ │ │
│  │ │ [View Details]                      [Cannot Edit]   │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ 🎯 Senior Stylist                   [Custom Role]   │ │ │
│  │ │                                                      │ │ │
│  │ │ Provider with additional permissions                 │ │ │
│  │ │                                                      │ │ │
│  │ │ Permissions: provider + waitlist:manage              │ │ │
│  │ │ Users: 2                                             │ │ │
│  │ │                                                      │ │ │
│  │ │ [View Details]  [Edit]  [Delete]                    │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5. Role Details Modal

**Modal Design:**
```
┌──────────────────────────────────────────────────┐
│  Edit Role: Senior Stylist                  [×] │
├──────────────────────────────────────────────────┤
│                                                   │
│  Role Name                                        │
│  ┌──────────────────────────────────────────────┐│
│  │ Senior Stylist                                ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Description                                      │
│  ┌──────────────────────────────────────────────┐│
│  │ Provider with additional permissions for      ││
│  │ managing waitlist and training new staff      ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Permissions (Select all that apply)              │
│                                                   │
│  Appointments                                     │
│  ☑ Create appointments                            │
│  ☑ Read own appointments                          │
│  ☐ Read all appointments                          │
│  ☑ Update own appointments                        │
│  ☑ Delete own appointments                        │
│                                                   │
│  Calendars                                        │
│  ☑ Create calendars                               │
│  ☑ Read own calendars                             │
│  ☐ Read all calendars                             │
│  ☑ Update own calendars                           │
│  ☑ Delete own calendars                           │
│                                                   │
│  Availability                                     │
│  ☑ Create availability                            │
│  ☑ Read availability                              │
│  ☑ Update availability                            │
│  ☑ Delete availability                            │
│                                                   │
│  Waitlist                                         │
│  ☑ Create waitlist entries                        │
│  ☑ Read waitlist                                  │
│  ☑ Manage waitlist (promote/reject)               │
│                                                   │
│  Skills                                           │
│  ☐ Create skills                                  │
│  ☑ Read skills                                    │
│  ☐ Update skills                                  │
│  ☐ Delete skills                                  │
│                                                   │
│  Users                                            │
│  ☐ Create users                                   │
│  ☐ Read users                                     │
│  ☐ Update users                                   │
│  ☐ Delete users                                   │
│                                                   │
│  Roles                                            │
│  ☐ Create roles                                   │
│  ☐ Read roles                                     │
│  ☐ Update roles                                   │
│  ☐ Assign roles                                   │
│                                                   │
│  ┌──────────────┐  ┌────────────────────────────┐│
│  │    Cancel    │  │       Save Changes         ││
│  └──────────────┘  └────────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

### 6. Assign Role to User Modal

**Modal Design:**
```
┌──────────────────────────────────────────────────┐
│  Assign Role to User                         [×] │
├──────────────────────────────────────────────────┤
│                                                   │
│  User                                             │
│  ┌──────────────────────────────────────────────┐│
│  │ 🔍 Search users...                            ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☐ John Smith (john@example.com)              ││
│  │ ☐ Sarah Johnson (sarah@example.com)          ││
│  │ ☑ Mike Davis (mike@example.com)              ││
│  │ ☐ Emma Wilson (emma@example.com)             ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Selected: Mike Davis                             │
│  Current Roles: Provider, Support                 │
│                                                   │
│  Role to Assign                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ▼ Select role...                              ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ • Owner (Full access)                         ││
│  │ • Admin (Manage team and settings)            ││
│  │ • Provider (Manage own calendar)              ││
│  │ • Senior Stylist (Provider + extras)          ││
│  │ • Support (Help users)                        ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ☐ Temporary Assignment                           │
│  Expires on: [Date Picker]                        │
│                                                   │
│  Reason (Optional)                                │
│  ┌──────────────────────────────────────────────┐│
│  │ Promoted to senior stylist position           ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ⚠️  This will grant the following permissions:   │
│  • Manage own calendar and appointments           │
│  • Manage waitlist entries                        │
│  • View team schedules                            │
│                                                   │
│  ┌──────────────┐  ┌────────────────────────────┐│
│  │    Cancel    │  │      Assign Role           ││
│  └──────────────┘  └────────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

### 7. Waitlist Page (Client View)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Book Appointment] [Waitlist] ...  [JD▾]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ← Back                                                       │
│                                                               │
│  My Waitlist 🕐                               [+ Join New]   │
│                                                               │
│  Get notified when your preferred time becomes available      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Active (2)] [Promoted (1)] [Expired (0)]              │ │
│  │                                                          │ │
│  │ ACTIVE WAITLIST ENTRIES                                 │ │
│  │                                                          │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ 🕐 Haircut with Sarah Johnson                      │ │ │
│  │ │                                                      │ │ │
│  │ │ Preferred: Nov 1-7, 2025                            │ │ │
│  │ │ Time Window: 2:00 PM - 5:00 PM                     │ │ │
│  │ │ Duration: 1 hour                                    │ │ │
│  │ │                                                      │ │ │
│  │ │ Priority: High                                      │ │ │
│  │ │ Position in Queue: #3 of 12                        │ │ │
│  │ │ Auto-book when available: [Enabled ✓]              │ │ │
│  │ │                                                      │ │ │
│  │ │ Added: 2 days ago                                   │ │ │
│  │ │ Expires: In 5 days                                  │ │ │
│  │ │                                                      │ │ │
│  │ │ [View Details]  [Edit]  [Cancel Entry]             │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ 🕐 Color with Mike Davis                           │ │ │
│  │ │                                                      │ │ │
│  │ │ Preferred: Nov 10-15, 2025                          │ │ │
│  │ │ Time Window: Any time                               │ │ │
│  │ │ Duration: 2 hours                                   │ │ │
│  │ │                                                      │ │ │
│  │ │ Priority: Medium                                    │ │ │
│  │ │ Position in Queue: #7 of 15                        │ │ │
│  │ │ Auto-book when available: [Disabled]                │ │ │
│  │ │                                                      │ │ │
│  │ │ Added: 5 hours ago                                  │ │ │
│  │ │ Expires: In 6 days                                  │ │ │
│  │ │                                                      │ │ │
│  │ │ [View Details]  [Edit]  [Cancel Entry]             │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 💡 HOW IT WORKS                                         │ │
│  │                                                          │ │
│  │ 1. Join the waitlist for your preferred time            │ │
│  │ 2. We'll monitor when that time becomes available       │ │
│  │ 3. You'll get notified immediately                      │ │
│  │ 4. If auto-book is enabled, we'll book it for you!     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8. Join Waitlist Flow

**Step 1: Select Provider & Service**
```
┌──────────────────────────────────────────────────┐
│  Join Waitlist                         [Step 1/3] │
├──────────────────────────────────────────────────┤
│                                                   │
│  Select Provider                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ 🔍 Search providers...                        ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Sarah Johnson                               ││
│  │   Hair Stylist • 4.9 ⭐ (127 reviews)         ││
│  │   Skills: Haircut, Color, Highlights          ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☐ Mike Davis                                  ││
│  │   Colorist • 4.8 ⭐ (95 reviews)              ││
│  │   Skills: Color, Balayage, Highlights         ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Service Type                                     │
│  ┌──────────────────────────────────────────────┐│
│  │ ▼ Select service...                           ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ • Haircut (1 hour) - $50                      ││
│  │ • Color (2 hours) - $120                      ││
│  │ • Highlights (2.5 hours) - $150               ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│                          ┌────────────────────────┐│
│                          │        Next            ││
│                          └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

**Step 2: Set Time Preferences**
```
┌──────────────────────────────────────────────────┐
│  Join Waitlist                         [Step 2/3] │
├──────────────────────────────────────────────────┤
│                                                   │
│  ← Back                                           │
│                                                   │
│  When would you like your appointment?            │
│                                                   │
│  Preferred Date Range                             │
│  ┌──────────────────────┐  ┌────────────────────┐│
│  │ From: Nov 1, 2025    │  │ To: Nov 7, 2025    ││
│  └──────────────────────┘  └────────────────────┘│
│                                                   │
│  Preferred Time Window                            │
│  ┌──────────────────────┐  ┌────────────────────┐│
│  │ Start: 2:00 PM       │  │ End: 5:00 PM       ││
│  └──────────────────────┘  └────────────────────┘│
│                                                   │
│  ☑ I'm flexible with timing                       │
│  ☐ Prefer specific days (Mon, Wed, Fri)          │
│                                                   │
│  Duration                                         │
│  ┌──────────────────────────────────────────────┐│
│  │ 1 hour (based on selected service)            ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Priority (Optional)                              │
│  ○ Low     ● Normal     ○ High     ○ Urgent      │
│                                                   │
│  Note: Higher priority may incur additional fees  │
│                                                   │
│  ┌──────────────┐       ┌────────────────────────┐│
│  │     Back     │       │        Next            ││
│  └──────────────┘       └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

**Step 3: Confirm & Settings**
```
┌──────────────────────────────────────────────────┐
│  Join Waitlist                         [Step 3/3] │
├──────────────────────────────────────────────────┤
│                                                   │
│  ← Back                                           │
│                                                   │
│  Review & Confirm                                 │
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ WAITLIST SUMMARY                              ││
│  │                                                ││
│  │ Provider: Sarah Johnson                        ││
│  │ Service: Haircut (1 hour)                     ││
│  │ Preferred: Nov 1-7, 2025, 2-5 PM              ││
│  │ Priority: Normal                               ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Notification Settings                            │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Email notifications                         ││
│  │ ☑ SMS notifications                           ││
│  │ ☐ Push notifications                          ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Auto-Booking                                     │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Automatically book when slot available      ││
│  │                                                ││
│  │ If enabled, we'll instantly book the          ││
│  │ appointment for you when it becomes available.││
│  │ You'll have 24 hours to cancel if needed.     ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Expiration                                       │
│  ┌──────────────────────────────────────────────┐│
│  │ This entry will expire in 7 days              ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Additional Notes (Optional)                      │
│  ┌──────────────────────────────────────────────┐│
│  │ I prefer afternoons if possible               ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────┐       ┌────────────────────────┐│
│  │     Back     │       │   Join Waitlist        ││
│  └──────────────┘       └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

### 9. Group Booking Creation (Admin/Provider)

**Step 1: Basic Info**
```
┌──────────────────────────────────────────────────┐
│  Create Group Appointment              [Step 1/4] │
├──────────────────────────────────────────────────┤
│                                                   │
│  Group Appointment Details                        │
│                                                   │
│  Name (Optional)                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Team Planning Workshop                        ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Description                                      │
│  ┌──────────────────────────────────────────────┐│
│  │ Quarterly planning session with all           ││
│  │ department heads                              ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Date & Time                                      │
│  ┌──────────────────────────────────────────────┐│
│  │ Date: Nov 1, 2025                             ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────┐  ┌────────────────────┐│
│  │ Start: 10:00 AM      │  │ End: 12:00 PM      ││
│  └──────────────────────┘  └────────────────────┘│
│                                                   │
│  Duration: 2 hours                                │
│                                                   │
│  Participants                                     │
│  ┌──────────────────────┐  ┌────────────────────┐│
│  │ Min: 3               │  │ Max: 10            ││
│  └──────────────────────┘  └────────────────────┘│
│                                                   │
│                          ┌────────────────────────┐│
│                          │        Next            ││
│                          └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

**Step 2: Select Providers (Required)**
```
┌──────────────────────────────────────────────────┐
│  Create Group Appointment              [Step 2/4] │
├──────────────────────────────────────────────────┤
│                                                   │
│  ← Back                                           │
│                                                   │
│  Select Required Providers                        │
│                                                   │
│  These providers must all be available            │
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ 🔍 Search providers...                        ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Sarah Johnson (Owner)                       ││
│  │   Available ✓                                 ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Mike Davis (Provider)                       ││
│  │   Available ✓                                 ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☐ Emma Wilson (Provider)                      ││
│  │   Unavailable ✗ (Already booked 10-11 AM)    ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Selected: 2 providers                            │
│                                                   │
│  ⚠️  Warning: Slot is not available for Emma      │
│  [Check Group Availability] to find common times  │
│                                                   │
│  ┌──────────────┐       ┌────────────────────────┐│
│  │     Back     │       │        Next            ││
│  └──────────────┘       └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

**Step 3: Add Participants (Optional)**
```
┌──────────────────────────────────────────────────┐
│  Create Group Appointment              [Step 3/4] │
├──────────────────────────────────────────────────┤
│                                                   │
│  ← Back                                           │
│                                                   │
│  Add Participants (Optional)                      │
│                                                   │
│  Invite clients or team members                   │
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ 🔍 Search users...                            ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Tom Wilson (Client)                         ││
│  │   tom@example.com                             ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Jessica Smith (Support)                     ││
│  │   jessica@example.com                         ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ☐ David Brown (Client)                        ││
│  │   david@example.com                           ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Selected: 2 participants (+ 2 providers = 4/10) │
│                                                   │
│  Or invite by email                               │
│  ┌──────────────────────────────────────────────┐│
│  │ guest@example.com                             ││
│  └──────────────────────────────────────────────┘│
│  [+ Add Email]                                    │
│                                                   │
│  ┌──────────────┐       ┌────────────────────────┐│
│  │     Back     │       │        Next            ││
│  └──────────────┘       └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

**Step 4: Confirmation Settings**
```
┌──────────────────────────────────────────────────┐
│  Create Group Appointment              [Step 4/4] │
├──────────────────────────────────────────────────┤
│                                                   │
│  ← Back                                           │
│                                                   │
│  Review & Settings                                │
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ APPOINTMENT SUMMARY                           ││
│  │                                                ││
│  │ Name: Team Planning Workshop                  ││
│  │ Date: Nov 1, 2025                             ││
│  │ Time: 10:00 AM - 12:00 PM (2 hours)          ││
│  │                                                ││
│  │ Required Providers (2):                       ││
│  │ • Sarah Johnson (Owner)                       ││
│  │ • Mike Davis (Provider)                       ││
│  │                                                ││
│  │ Participants (2):                             ││
│  │ • Tom Wilson (Client)                         ││
│  │ • Jessica Smith (Support)                     ││
│  │                                                ││
│  │ Total: 4 of 10 max participants               ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Confirmation Settings                            │
│  ┌──────────────────────────────────────────────┐│
│  │ ☑ Require all providers to confirm            ││
│  │ ☑ Require all participants to confirm         ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Confirmation Deadline                            │
│  ┌──────────────────────────────────────────────┐│
│  │ Oct 30, 2025 at 11:59 PM                      ││
│  │ (2 days before appointment)                   ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  Auto-confirm when                                │
│  ● All participants confirm                       │
│  ○ Minimum participants confirm (3)               │
│  ○ Manual confirmation only                       │
│                                                   │
│  Notification Schedule                            │
│  ☑ Send invitations immediately                   │
│  ☑ Reminder 24 hours before deadline              │
│  ☑ Reminder 1 hour before appointment             │
│                                                   │
│  ┌──────────────┐       ┌────────────────────────┐│
│  │     Back     │       │  Create & Send Invites ││
│  └──────────────┘       └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

### 10. Audit Log Page (Admin)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Team] [Roles] [Analytics] [Audit] [SD▾]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ← Back to Dashboard                                          │
│                                                               │
│  Audit Logs 📋                                  [Export CSV]  │
│                                                               │
│  Track all system activity and changes                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FILTERS                                                 │ │
│  │                                                          │ │
│  │ Date Range                                               │ │
│  │ ┌──────────────────┐  ┌──────────────────┐             │ │
│  │ │ From: Oct 1, 2025│  │ To: Nov 1, 2025  │             │ │
│  │ └──────────────────┘  └──────────────────┘             │ │
│  │                                                          │ │
│  │ User                       Action                        │ │
│  │ ┌──────────────────────┐  ┌──────────────────────────┐ │ │
│  │ │ All Users          ▾ │  │ All Actions           ▾ │ │ │
│  │ └──────────────────────┘  └──────────────────────────┘ │ │
│  │                                                          │ │
│  │ Resource Type              Status                        │ │
│  │ ┌──────────────────────┐  ┌──────────────────────────┐ │ │
│  │ │ All Resources      ▾ │  │ All Statuses          ▾ │ │ │
│  │ └──────────────────────┘  └──────────────────────────┘ │ │
│  │                                                          │ │
│  │ [Clear Filters]                       [Apply Filters]   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ RECENT ACTIVITY (1,234 entries)            [1] [2] [>] │ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────────┤ │
│  │ │ 2 min ago • Sarah Johnson assigned 'admin' role      │ │
│  │ │             to Mike Davis                            │ │
│  │ │ Success • 192.168.1.1 • Chrome                      │ │
│  │ │ [View Details]                                       │ │
│  │ └──────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────────┤ │
│  │ │ 15 min ago • Tom Wilson cancelled appointment        │ │
│  │ │              #12345                                  │ │
│  │ │ Success • 192.168.1.45 • Safari                     │ │
│  │ │ [View Details]                                       │ │
│  │ └──────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────────┤ │
│  │ │ 1 hour ago • System promoted waitlist entry #567     │ │
│  │ │              for Jessica Smith                       │ │
│  │ │ Success • Automated • Background Job                │ │
│  │ │ [View Details]                                       │ │
│  │ └──────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────────┤ │
│  │ │ 2 hours ago • Mike Davis attempted to delete         │ │
│  │ │               system role 'owner'                    │ │
│  │ │ Failed • 192.168.1.20 • Chrome                      │ │
│  │ │ Error: Cannot delete system roles                   │ │
│  │ │ [View Details]                                       │ │
│  │ └──────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────────┤ │
│  │ │ 3 hours ago • Emma Wilson updated availability       │ │
│  │ │               for next week                          │ │
│  │ │ Success • 192.168.1.67 • Firefox                    │ │
│  │ │ [View Details]                                       │ │
│  │ └──────────────────────────────────────────────────────┤ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Audit Detail Modal:**
```
┌──────────────────────────────────────────────────┐
│  Audit Log Details                           [×] │
├──────────────────────────────────────────────────┤
│                                                   │
│  Event ID: aud_7d8f9a0b1c2d3e4f                  │
│                                                   │
│  TIMESTAMP                                        │
│  Nov 1, 2025 at 2:15:34 PM UTC                   │
│                                                   │
│  ACTOR                                            │
│  Sarah Johnson (sarah@example.com)               │
│  Role: Owner                                      │
│  IP Address: 192.168.1.1                         │
│  User Agent: Chrome 118.0.0.0                    │
│                                                   │
│  ACTION                                           │
│  roles.assign                                     │
│  Assigned role to user                            │
│                                                   │
│  RESOURCE                                         │
│  Type: users                                      │
│  ID: usr_1a2b3c4d5e6f                            │
│  Name: Mike Davis                                 │
│                                                   │
│  REQUEST                                          │
│  Method: POST                                     │
│  Path: /api/v1/rbac/users/usr_1a2b3c4d5e6f/roles │
│                                                   │
│  CHANGES                                          │
│  ┌─────────────────────────────────────────────┐ │
│  │ {                                            │ │
│  │   "roleId": "rol_admin",                    │ │
│  │   "assignedBy": "usr_sarah",                │ │
│  │   "reason": "Promoted to management"        │ │
│  │ }                                            │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  RESULT                                           │
│  Status: Success (200 OK)                         │
│  Duration: 45ms                                   │
│                                                   │
│  METADATA                                         │
│  Tenant: acme_corp                                │
│  Session: ses_9f8e7d6c5b4a                       │
│                                                   │
│                          ┌────────────────────────┐│
│                          │        Close           ││
│                          └────────────────────────┘│
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## State Management Architecture

### React Query Configuration

```javascript
// frontend/src/config/queryClient.js

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      onError: (error) => {
        // Global error handling
        if (error.response?.status === 401) {
          // Handle unauthorized
        } else if (error.response?.status === 403) {
          // Handle forbidden
        }
      }
    },
    mutations: {
      onError: (error) => {
        // Show error toast
      }
    }
  }
});
```

### Custom Hooks

```javascript
// frontend/src/hooks/useAuth.js

export const useAuth = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me'),
    staleTime: Infinity, // Don't refetch user data automatically
    retry: false
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions', 'me'],
    queryFn: () => api.get('/rbac/me/permissions'),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!user // Only fetch if user exists
  });

  return {
    user: user?.data,
    permissions: permissions?.data?.permissions || [],
    isLoading,
    hasPermission: (permission) =>
      permissions?.data?.permissions.includes(permission),
    hasAllPermissions: (perms) =>
      perms.every(p => permissions?.data?.permissions.includes(p)),
    hasAnyPermission: (perms) =>
      perms.some(p => permissions?.data?.permissions.includes(p))
  };
};
```

```javascript
// frontend/src/hooks/useAppointments.js

export const useAppointments = (filters = {}) => {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => api.get('/appointments', { params: filters }),
    staleTime: 1000 * 60 * 2 // 2 minutes
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/appointments', data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['availability']);
    }
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/appointments/${id}`),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries(['appointments']);
      const previousAppointments = queryClient.getQueryData(['appointments']);

      queryClient.setQueryData(['appointments'], (old) => {
        return old.filter(apt => apt.id !== id);
      });

      return { previousAppointments };
    },
    onError: (err, id, context) => {
      // Rollback on error
      queryClient.setQueryData(['appointments'], context.previousAppointments);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['appointments']);
    }
  });
};
```

```javascript
// frontend/src/hooks/useWaitlist.js

export const useWaitlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['waitlist', user?.id],
    queryFn: () => api.get(`/waitlist/user/${user.id}`),
    refetchInterval: 30000, // Poll every 30 seconds for promotions
    enabled: !!user
  });
};

export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/waitlist', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['waitlist']);
    }
  });
};
```

```javascript
// frontend/src/hooks/useRoles.js

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/rbac/roles'),
    staleTime: 1000 * 60 * 10 // 10 minutes (roles change infrequently)
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }) =>
      api.post(`/rbac/users/${userId}/roles`, { roleId }),
    onSuccess: (data, variables) => {
      // Invalidate user's permissions
      queryClient.invalidateQueries(['permissions', variables.userId]);
      queryClient.invalidateQueries(['users', variables.userId]);
    }
  });
};
```

### Context Providers

```javascript
// frontend/src/contexts/AuthContext.jsx

import { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me'),
    retry: false,
    staleTime: Infinity
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions', 'me'],
    queryFn: () => api.get('/rbac/me/permissions'),
    enabled: !!user?.data,
    staleTime: 1000 * 60 * 60 // 1 hour
  });

  const loginMutation = useMutation({
    mutationFn: (credentials) => api.post('/auth/login', credentials),
    onSuccess: () => {
      queryClient.invalidateQueries(['auth', 'me']);
      queryClient.invalidateQueries(['permissions', 'me']);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
    }
  });

  const value = {
    user: user?.data,
    permissions: permissions?.data?.permissions || [],
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    hasPermission: (permission) =>
      permissions?.data?.permissions.includes(permission),
    hasAllPermissions: (perms) =>
      perms.every(p => permissions?.data?.permissions.includes(p)),
    hasAnyPermission: (perms) =>
      perms.some(p => permissions?.data?.permissions.includes(p))
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Global State (Optional - for UI state only)

```javascript
// frontend/src/store/uiStore.js
// Using Zustand for simple UI state

import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'light',
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification]
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
}));
```

---

## Accessibility & Responsive Design

### Accessibility Checklist

**Keyboard Navigation:**
```javascript
// All interactive elements must be keyboard accessible

<Button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
>
  Click Me
</Button>

// Modal focus trap
<Modal onClose={onClose}>
  <FocusTrap>
    <ModalContent />
  </FocusTrap>
</Modal>
```

**ARIA Labels:**
```jsx
<button
  aria-label="Delete appointment"
  aria-describedby="delete-tooltip"
>
  <IconTrash />
</button>

<input
  type="text"
  aria-label="Search appointments"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-message" : null}
/>

<select aria-label="Filter by status">
  <option>All</option>
  <option>Active</option>
  <option>Cancelled</option>
</select>
```

**Screen Reader Support:**
```jsx
// Live regions for dynamic updates
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {notification && <p>{notification.message}</p>}
</div>

// Hidden helper text
<span className="sr-only">
  This action will permanently delete the appointment
</span>
```

**Color Contrast:**
```css
/* WCAG AA requires 4.5:1 for normal text, 3:1 for large */

/* Good: 7:1 contrast */
.text-primary {
  color: #1976D2; /* on white background */
}

/* Good: 4.6:1 contrast */
.text-secondary {
  color: #616161; /* on white background */
}

/* Bad: 2.8:1 contrast (fails WCAG) */
.text-disabled {
  color: #E0E0E0; /* Too light on white */
}
```

### Responsive Breakpoints

```css
/* Mobile First Approach */

/* Base styles (mobile) */
.container {
  padding: var(--spacing-4);
}

/* Small tablets */
@media (min-width: 640px) {
  .container {
    padding: var(--spacing-6);
  }
}

/* Tablets */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-8);
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Laptops */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }

  .sidebar {
    display: block; /* Show sidebar on desktop */
  }
}

/* Desktops */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

**Responsive Navigation:**
```jsx
// Mobile: Hamburger menu
// Desktop: Horizontal nav

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <nav>
      {isMobile ? (
        <>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <IconMenu />
          </button>
          {mobileMenuOpen && (
            <MobileMenu onClose={() => setMobileMenuOpen(false)} />
          )}
        </>
      ) : (
        <DesktopNav />
      )}
    </nav>
  );
};
```

---

## Implementation Roadmap

### Week 1: Foundation & Core Components

**Day 1-2: Design System Setup**
- [ ] Set up CSS variables (colors, typography, spacing)
- [ ] Create base components (Button, Card, Modal, Badge)
- [ ] Set up Tailwind CSS with custom theme
- [ ] Create component Storybook

**Day 3-4: Auth Context & Permissions**
- [ ] Implement AuthContext with React Query
- [ ] Create useAuth hook
- [ ] Create usePermissions hook
- [ ] Implement PermissionGate component
- [ ] Implement ProtectedRoute component

**Day 5: Dashboard Layouts**
- [ ] Create responsive layout component
- [ ] Implement navigation (mobile + desktop)
- [ ] Create dashboard shells for each role

### Week 2: RBAC UI

**Day 1-2: Role Management Pages**
- [ ] Role list page
- [ ] Role details/edit modal
- [ ] Create role modal
- [ ] Permission selection UI

**Day 3-4: User Role Assignment**
- [ ] User list with roles
- [ ] Assign role modal
- [ ] Remove role confirmation
- [ ] Bulk role assignment

**Day 5: Testing & Polish**
- [ ] Unit tests for RBAC components
- [ ] Integration tests
- [ ] Accessibility audit
- [ ] Responsive testing

### Week 3: Waitlist UI

**Day 1-2: Waitlist Management**
- [ ] Waitlist entry card component
- [ ] My waitlist page (client view)
- [ ] Waitlist management page (admin view)
- [ ] Promotion notifications

**Day 3-4: Join Waitlist Flow**
- [ ] Multi-step wizard
- [ ] Provider selection
- [ ] Time preferences
- [ ] Confirmation settings

**Day 5: Integration & Testing**
- [ ] Connect to backend APIs
- [ ] Real-time updates (polling)
- [ ] Test waitlist promotion flow
- [ ] Edge cases (expiration, cancellation)

### Week 4: Group Bookings & Polish

**Day 1-2: Group Booking Creation**
- [ ] Multi-step wizard
- [ ] Provider selection with availability
- [ ] Participant invitation
- [ ] Confirmation settings

**Day 3: Group Booking Management**
- [ ] Group appointment card
- [ ] Accept/decline invitations
- [ ] Track confirmation status
- [ ] Reminder system

**Day 4: Audit Logs UI**
- [ ] Audit log list with filters
- [ ] Audit detail modal
- [ ] Export functionality
- [ ] Search and pagination

**Day 5: Final Polish**
- [ ] E2E testing (Playwright)
- [ ] Performance optimization
- [ ] Accessibility final check
- [ ] Bug fixes and refinements

---

## Design Deliverables

### For Developer

1. **Component Library** (Storybook)
   - All base components with props documented
   - Interactive examples
   - Code snippets

2. **Figma/Sketch Files** (Optional but recommended)
   - High-fidelity mockups
   - Component library
   - Design tokens

3. **Style Guide Document**
   - Color palette with hex codes
   - Typography scale
   - Spacing system
   - Border radius values
   - Shadow values

4. **Implementation Guide**
   - Component usage examples
   - State management patterns
   - API integration patterns
   - Testing strategies

5. **Accessibility Checklist**
   - WCAG 2.1 AA requirements
   - Keyboard navigation map
   - Screen reader testing results
   - Color contrast audit

---

## Next Steps

1. **Review & Approve Design** (1-2 days)
   - Stakeholder review of mockups
   - Gather feedback
   - Make adjustments

2. **Create Figma Mockups** (Optional, 2-3 days)
   - High-fidelity designs
   - Interactive prototypes
   - Design handoff

3. **Set Up Development Environment** (1 day)
   - Install dependencies
   - Configure Tailwind/styled-components
   - Set up Storybook

4. **Begin Implementation** (Week 1)
   - Follow implementation roadmap
   - Build foundation first
   - Iterate based on feedback

---

**Design Status:** ✅ **COMPLETE - READY FOR IMPLEMENTATION**
**Estimated Implementation Time:** 4 weeks (parallel with backend development)
**Designer:** Technical Lead / UI/UX Designer
**Approved By:** [Pending stakeholder review]
