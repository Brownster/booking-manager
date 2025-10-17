# Quick Start Checklist for New Developer

**Goal:** Get productive in 30 minutes

---

## ☑️ Setup Checklist (15 minutes)

### Prerequisites
- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm v9+ installed (`npm --version`)
- [ ] Docker installed (`docker --version`)
- [ ] Git configured

### Initial Setup
```bash
# 1. Navigate to project
cd /home/marc/Documents/calender-booking-system

# 2. Start Docker containers
docker compose up -d

# 3. Install backend dependencies
cd backend
npm install

# 4. Run migrations
npm run db:migrate

# 5. Install frontend dependencies
cd ../frontend
npm install
```

### Verify Setup
```bash
# Backend tests (should see 26 passing)
cd backend
npm test -- --runInBand

# Frontend build (should succeed)
cd ../frontend
npm run build
```

**✅ If both pass, you're ready to code!**

---

## 📚 Reading List (15 minutes)

### Must Read (Priority Order)
1. [ ] `HANDOFF.md` - This project overview (5 min)
2. [ ] `docs/NEW-DEVELOPER-ONBOARDING.md` - Complete guide (10 min skim, reference later)
3. [ ] `docs/PHASE-2-REMAINING-TASKS.md` - Your task list (5 min)

### Reference (Read as needed)
- `docs/PHASE-2-FINAL-STATUS.md` - What's already done
- `frontend/src/pages/WaitlistPage.jsx` - Best code example
- `docs/rbac-implementation-review.md` - RBAC deep dive

---

## 🎯 First Task: Authentication UI (Day 1-2)

### Files to Create/Modify
- [ ] `frontend/src/context/AuthContext.jsx` - Implement login/logout
- [ ] `frontend/src/pages/LoginPage.jsx` - Create login form
- [ ] `frontend/src/router/index.jsx` - Add protected routes
- [ ] `frontend/src/components/layout/AppLayout.jsx` - Add logout button

### Quick Implementation Guide

**1. AuthContext Implementation (2-3 hours)**
```javascript
// frontend/src/context/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email, password, tenantId) => {
    const response = await apiClient.post('/auth/login', { email, password, tenantId });
    setUser(response.data.user);
    // Store access token in memory
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.tokens.accessToken}`;
    return response.data;
  };

  const logout = async () => {
    await apiClient.post('/auth/logout');
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  // TODO: Add refreshToken() function
  // TODO: Add auto-refresh on mount

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**2. Login Page (2-3 hours)**
```javascript
// frontend/src/pages/LoginPage.jsx
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password, 'tenant-id-here');
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};
```

**3. Protected Routes (1 hour)**
```javascript
// frontend/src/router/index.jsx
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <Outlet />;
};

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        {/* Other routes */}
      </Route>
    </Route>
  </Routes>
);
```

**4. Test Your Work**
```bash
# Start servers
cd backend && npm start &
cd frontend && npm run dev

# Manual test:
# 1. Visit http://localhost:5173/
# 2. Should redirect to /login
# 3. Enter credentials (create user via API first)
# 4. Should redirect to dashboard
# 5. Click logout
# 6. Should redirect to login
```

---

## 🚀 Daily Workflow

### Morning Routine
```bash
# 1. Pull latest changes
git pull origin main

# 2. Create/switch to feature branch
git checkout -b feature/auth-ui

# 3. Start services
docker compose up -d
cd backend && npm start &
cd ../frontend && npm run dev &

# 4. Check everything works
curl http://localhost:3000/health
open http://localhost:5173/
```

### Before Committing
```bash
# 1. Test backend
cd backend
npm test -- --runInBand      # Must pass

# 2. Test frontend
cd frontend
npm run build                # Must succeed
npm run lint                 # Should have 0 errors

# 3. Manual testing
# - Test your feature in browser
# - Check for console errors
# - Test error cases

# 4. Commit
git add .
git commit -m "feat: implement authentication UI"
git push origin feature/auth-ui
```

### End of Day
```bash
# Stop services
docker compose stop

# Push work
git push origin feature/auth-ui

# Update progress (if needed)
# - Update task status in docs/PHASE-2-REMAINING-TASKS.md
# - Note any blockers or questions
```

---

## 🔍 Finding Things

### "Where is the X?"

**Backend:**
- API endpoints → `backend/src/routes/`
- Business logic → `backend/src/services/`
- Database queries → `backend/src/repositories/`
- Request handlers → `backend/src/controllers/`
- Validation → `backend/src/validators/`
- Tests → `backend/tests/integration/`

**Frontend:**
- Pages → `frontend/src/pages/`
- Reusable components → `frontend/src/components/`
- API calls → `frontend/src/services/`
- State management → `frontend/src/context/`
- Styles → `frontend/src/styles/`
- UI components → `frontend/src/components/ui/`

### "How do I X?"

**Backend:**
- Add new endpoint → Copy `waitlist.routes.js` pattern
- Add validation → Copy `waitlist.validators.js` pattern
- Add business logic → Copy `waitlist.service.js` pattern
- Add database queries → Copy `waitlist.repository.js` pattern

**Frontend:**
- Add new page → Copy `WaitlistPage.jsx` pattern
- Add new modal → Copy `WaitlistCreateModal` from `WaitlistPage.jsx`
- Add permission check → Use `<PermissionGate permissions="...">`
- Fetch data → Use React Query `useQuery` hook
- Mutate data → Use React Query `useMutation` hook

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check Docker is running
docker ps

# Restart containers
docker compose restart

# Check logs
docker compose logs postgres
docker compose logs redis

# Nuclear option
docker compose down -v
docker compose up -d
npm run db:migrate
```

### Frontend won't build
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for errors
npm run lint

# Try build again
npm run build
```

### Tests failing
```bash
# Make sure services are running
docker ps

# Run specific test
npm test waitlist

# Run with verbose output
npm test -- --verbose

# Check test database
# Make sure POSTGRES_TEST_PORT=5433 in .env
```

### Permission errors in UI
```bash
# Check RBACContext is loading
# Browser DevTools → React DevTools → Components → RBACContext
# Should see permissions array

# Check backend is returning permissions
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/rbac/me/permissions

# Check user has roles assigned
# Look in database: SELECT * FROM user_roles WHERE user_id = '...';
```

---

## 📊 Progress Tracking

### Week 1 Goals
- [ ] Day 1: Setup environment + read docs
- [ ] Day 2: Implement AuthContext + login page
- [ ] Day 3: Complete authentication flow + testing
- [ ] Day 4: Start RBAC admin modals
- [ ] Day 5: Complete RBAC admin modals

### Week 2 Goals
- [ ] Days 1-3: Group booking backend
- [ ] Days 4-5: Dashboard real data

### Week 3 Goals
- [ ] Test coverage
- [ ] Bug fixes
- [ ] Polish

---

## 💡 Pro Tips

1. **Use WaitlistPage.jsx as reference** - It's the perfect example of everything done right

2. **Test frequently** - Don't wait until the end to test
   ```bash
   npm test -- --watch  # Auto-run tests on save
   ```

3. **Use React Query DevTools** - Already installed, press `Ctrl+Shift+D` in browser

4. **Check existing tests** - They show how APIs work
   ```bash
   cat backend/tests/integration/waitlist.test.js
   ```

5. **Ask Claude Code** - I'm here to help! I have full context of the codebase

6. **Commit often** - Small commits are better than big ones

7. **Follow patterns** - Consistency matters more than cleverness

---

## 🎯 Success Indicators

### You're on track if:
- [ ] Tests pass locally
- [ ] Build succeeds
- [ ] No console errors
- [ ] Feature works in browser
- [ ] Code follows existing patterns
- [ ] Documentation updated

### You might be stuck if:
- Tests keep failing
- Not sure which pattern to follow
- API responses don't match expectations
- Permission errors you can't figure out

**If stuck → Ask Claude Code! I'm here to help unblock you.**

---

## 📞 Getting Help

### Quick Questions
- Check existing code first (especially `WaitlistPage.jsx`)
- Check tests for API usage examples
- Check documentation in `/docs`

### Complex Questions
- Ask Claude Code (I have full project context)
- I can help with:
  - Architecture decisions
  - Code reviews
  - Debugging
  - Test writing
  - Performance optimization

### Before Asking
1. What are you trying to do?
2. What have you tried?
3. What error are you seeing?
4. Can you reproduce it?

---

## 🎉 You're Ready!

**Next Steps:**
1. ✅ Setup complete? Start coding!
2. ✅ Docs read? You understand the project!
3. ✅ First task clear? Begin with authentication!

**Remember:**
- The previous developer did great work
- The foundation is solid
- You're finishing the last 25%
- I'm here to help every step of the way

**Let's ship Phase 2!** 🚀

---

**Last Updated:** 2025-10-17
**Version:** 1.0
**Next Review:** After authentication complete
