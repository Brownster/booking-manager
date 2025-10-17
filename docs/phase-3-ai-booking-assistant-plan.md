# Phase 3 Plan: AI-Powered Booking Assistant

## Executive Summary

Build a white-label, embeddable AI chat widget that enables small businesses (plumbers, hairdressers, etc.) to automate appointment booking. The system uses LangChain.js to power intelligent agent behavior that can look up existing customers, create new records, and guide users through the booking process naturally.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Websites                          │
│              (Embedded Chat Widget Script)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend Node.js Application                    │
├─────────────────────────────────────────────────────────────┤
│  AI Agent Service (LangChain)                              │
│  ├─ Conversation orchestration                             │
│  ├─ Tool routing & calling                                 │
│  └─ Context management                                     │
│                                                             │
│  MCP Server (Tool Gateway)                                 │
│  ├─ Customer lookup/creation                               │
│  ├─ Availability search                                    │
│  ├─ Booking confirmation                                   │
│  └─ History retrieval                                      │
│                                                             │
│  Booking Engine (Existing)                                 │
│  ├─ Calendar management                                    │
│  ├─ Appointment storage                                    │
│  └─ Business configuration                                 │
├─────────────────────────────────────────────────────────────┤
│  Database: PostgreSQL | Cache: Redis                       │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────────┐
│            Admin Dashboard (React)                          │
│            - Calendar management                           │
│            - Service/staff configuration                   │
│            - Widget customization                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Layered Component Breakdown

### Layer 1: Booking Engine (Existing Foundation)
**Responsibility:** Core business logic and data persistence
- Manage calendars, services, staff, and availability
- Store appointments and customer data
- Enforce business rules (duration, breaks, resource allocation)
- *Status:* Actively being built; stabilize Phases 1–2

### Layer 2: MCP Server (New Abstraction Layer)
**Responsibility:** Secure interface between AI and business logic
**Key Tools to expose:**
- `search_availability(service_id, date_range, duration)` → Returns open slots
- `find_customer(email, phone_number)` → Returns existing customer or null
- `create_customer(name, email, phone, metadata)` → Stores new customer
- `update_customer(customer_id, updates)` → Applies partial updates with audit trail
- `get_booking_history(customer_id)` → Returns past appointments for context
- `book_appointment(service_id, customer_id, datetime, notes)` → Creates appointment

**Why a separate layer?**
- Standardizes how the AI calls backend functions
- Allows granular permission control (which businesses can see which data)
- Makes it easy to add audit logging and rate limiting
- Isolates the AI from direct database access

### Layer 3: AI Agent Service (LangChain)
**Responsibility:** Manage conversation flow and intelligence
**Key capabilities:**
- Uses LangChain agents to decide which MCP tools to call
- Maintains conversation memory (understands context)
- Routes between different conversation types (new customer vs. returning, simple vs. complex bookings)
- Gracefully handles errors and clarifies user intent
- Customizable prompt templates per business

**Conversation flow example:**
```
User: "I need a plumbing repair tomorrow morning"
  ↓
Agent: Identifies intent → "book appointment"
  ↓
Agent calls: search_availability("plumbing_repair", tomorrow, morning)
  ↓
Agent: "I found 3 slots. Which works: 9am, 10:30am, or 2pm?"
  ↓
User: "9am"
  ↓
Agent calls: find_customer(user_email_or_phone) → finds existing customer
  ↓
Agent: "Welcome back! I see your last visit was 6 months ago for a leak. 
        Same issue, or something new?"
  ↓
User: "Different problem this time"
  ↓
Agent calls: book_appointment(...) → Stores appointment
  ↓
Agent: "All set! Your plumbing repair is booked for tomorrow at 9am."
```

### Layer 4: Chat Widget (Embeddable Frontend)
**Responsibility:** User-facing chat interface
- Lightweight React app bundled as a single script tag
- Sends user messages to the AI Agent Service
- Displays responses with formatting (rich UI elements like date pickers)
- Customizable branding (colors, logo, agent name)
- Works on any website without conflicts

**Installation for businesses:**
```html
<script src="https://booking-system.com/widget.js"></script>
<script>
  BookingWidget.init({
    businessId: 'abc123',
    serviceId: 'plumbing',
    primaryColor: '#0066cc',
    agentName: 'Alex'
  });
</script>
```

---

## Development Phases

### Phase 1–2: Core Booking Engine (In Progress)
**Goal:** Stabilize the foundation
- Complete RBAC (role-based access control)
- Implement group bookings if needed
- Robust admin dashboard
- Database schema finalized

### Phase 3: MCP Server & AI Foundations
**Goal:** Build the bridge between booking engine and AI

**Tasks:**
1. Define MCP tool specifications and TypeScript interfaces
2. Implement MCP server (Express endpoint that wraps booking engine)
3. Add authorization layer (which business calls which tool)
4. Set up LangChain.js in the Node.js app
5. Create base LangChain Agent with initial tool integration
6. Build conversation memory storage (Redis or in-memory for now)
7. Write integration tests

**Deliverable:** AI agent can successfully:
- Look up existing customers
- Search availability
- Create new customer records
- Update existing customer records with guardrails
- Book an appointment

### Customer Lifecycle Handling

To keep customer data accurate while preventing duplicate records, the MCP server will mediate every lookup, creation, and update request the agent makes.

1. **Lookup-first strategy** – The agent always calls `find_customer` with any identifiers it has (email, phone, external CRM id). The MCP layer normalizes the identifiers (lowercasing emails, stripping punctuation from phone numbers) and queries the booking engine. Exact matches return the canonical customer record plus metadata describing confidence and source.
2. **Merge & update guardrails** – When a customer is found but new attributes are supplied (e.g., updated phone), the agent calls `update_customer`. The MCP server validates allowed fields, applies the change in a transactional call to the booking engine, and emits an audit log entry that includes the prior value, new value, and AI request id for traceability.
3. **New customer creation** – Only when `find_customer` returns null does the agent call `create_customer`. The MCP server deduplicates by running the lookup again inside the same transaction before persisting the new customer. A generated `source=ai_widget` tag allows downstream reporting.
4. **Conflict handling** – If concurrent updates occur, the booking engine returns a version conflict. The MCP layer surfaces a structured error so the agent can apologize and re-fetch the record before retrying.
5. **Privacy filtering** – The MCP server enforces per-business field visibility, ensuring the agent cannot read or mutate fields (e.g., internal notes) that the business marked as private.

This flow ensures the AI behaves deterministically, keeps the booking database clean, and gives operators a full audit trail for any agent-initiated customer changes.

### Phase 4: Chat Widget MVP
**Goal:** Create the embeddable widget and end-to-end booking flow

**Tasks:**
1. Create lightweight React app for chat UI
2. Build script-tag embedding mechanism (no npm install needed)
3. Integrate widget with AI Agent Service via WebSocket or polling
4. Add basic styling and responsiveness
5. Test on sample websites

**Deliverable:** A business can drop a script tag on their site and immediately get a working booking assistant

### Phase 5: Advanced AI & Business Customization
**Goal:** Make the system flexible and production-ready

**Tasks:**
1. Enhance LangChain agent:
   - Handle follow-up questions ("How did your last appointment go?")
   - Support multiple conversation branches (e.g., "Actually, I want to reschedule")
   - Fallback to human handoff if agent is stuck
2. Build admin UI for businesses to:
   - Customize agent prompts and greeting
   - Configure required fields (some need phone, some need address)
   - Set industry-specific questions (e.g., "Any allergies?" for hairdressing)
   - View conversation transcripts and bookings
3. Add analytics (successful bookings, abandoned chats, etc.)
4. Implement multi-language support

### Phase 6: Production & Scale
**Goal:** Deploy and monitor

**Tasks:**
1. Set up proper error handling and logging
2. Add rate limiting and security measures
3. Create monitoring/alerting
4. Build customer onboarding flow
5. Plan for multi-tenant isolation
6. Performance optimization (caching, CDN for widget)

---

## Key Decision Points

### 1. LLM Choice
- **Recommendation:** Claude API (via Anthropic SDK) for quality + cost-effectiveness
- **Alternative:** OpenAI GPT-4, but typically more expensive
- LangChain.js abstracts this away, so you can switch later if needed

### 2. Conversation State Storage
- **Phase 3:** In-memory (testing)
- **Phase 4+:** Redis (handles scaling and persistence)

### 3. Widget Embedding Strategy
- **Chosen:** Single script tag that dynamically injects a React app into the page
- **Alternative:** iframe (more isolated but less flexible for styling)

### 4. Business Customization Scope
- **Phase 4:** Fixed prompts per industry
- **Phase 5+:** Admin UI for custom prompts and fields

---

## Success Metrics

By end of Phase 4, you should have:
- ✅ A fully functional booking flow (end-to-end)
- ✅ Customer lookup and creation working
- ✅ Natural conversation feel (not robotic)
- ✅ Widget embeddable on 3+ test websites
- ✅ At least one real business using it

By end of Phase 5:
- ✅ Businesses can customize the agent's behavior
- ✅ Multi-industry support (plumbing, hairdressing, consulting, etc.)
- ✅ Follow-up questions and context awareness working

---

## Technology Stack Summary

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express.js |
| AI Framework | LangChain.js |
| LLM API | Anthropic Claude (or OpenAI) |
| Database | PostgreSQL |
| Cache | Redis |
| Widget Frontend | React |
| Widget Embedding | Script tag injection |
| Admin Dashboard | React (existing) |

---

## Next Steps

1. **This week:** Review and approve this plan
2. **Phase 3 kickoff:** Define the exact MCP tool specs (parameter names, return types, error handling)
3. **Begin:** Set up LangChain in your existing Node.js app; implement the first 2–3 MCP tools
4. **Test:** Manual testing of agent calling tools correctly
5. **Iterate:** Refine prompt and conversation flow based on testing
