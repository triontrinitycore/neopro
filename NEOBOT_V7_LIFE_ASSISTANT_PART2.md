# 🌟 NEOBOT V7 - LIFE ASSISTANT (PART 2)
## Office Automation & Household Problem Solving

---

## 💼 6. OFFICE WORK AUTOMATION

### **A. Daily Office Tasks Automation**

```kotlin
// AI-powered office assistant

class OfficeAutomation {
    
    // Morning briefing - daily work summary
    suspend fun morningBriefing(userId: String): MorningBriefing {
        
        val today = LocalDate.now()
        
        // Collect all relevant info
        val calendar = getCalendarEvents(userId, today)
        val emails = getUnreadEmails(userId)
        val tasks = getPendingTasks(userId)
        val meetings = getUpcomingMeetings(userId, today)
        val deadlines = getUpcomingDeadlines(userId)
        val weather = getWeather()
        val news = getRelevantNews(userId)
        val traffic = getTrafficUpdate()
        
        // AI summary generation
        val prompt = """
        Generate a concise morning briefing for the user.
        
        Today's Date: ${today}
        Weather: ${weather}
        
        Calendar:
        ${calendar.joinToString("\n") { "- ${it.time}: ${it.title}" }}
        
        Pending Tasks (${tasks.size}):
        ${tasks.take(5).joinToString("\n") { "- ${it.title} (${it.priority})" }}
        
        Unread Emails (${emails.size}):
        ${emails.take(10).joinToString("\n") { "- From: ${it.from}, Subject: ${it.subject}" }}
        
        Upcoming Deadlines:
        ${deadlines.joinToString("\n") { "- ${it.project}: ${it.deadline}" }}
        
        Generate a friendly, actionable briefing highlighting:
        1. Most important tasks today
        2. Critical meetings
        3. Urgent emails to respond to
        4. Deadlines to watch
        5. Recommended priorities
        """
        
        val briefing = GPT5.complete(prompt)
        
        // Text-to-speech
        val audioUrl = textToSpeech(briefing)
        
        return MorningBriefing(
            date = today,
            summary = briefing,
            audioUrl = audioUrl,
            calendar = calendar,
            emails = emails,
            tasks = tasks,
            meetings = meetings,
            deadlines = deadlines,
            weather = weather,
            traffic = traffic
        )
    }
    
    // Smart email management
    suspend fun manageEmails(userId: String): EmailManagement {
        
        // Get all unread emails
        val emails = getUnreadEmails(userId)
        
        // AI categorization
        val categorized = emails.map { email ->
            categorizeEmail(email)
        }
        
        // Priority classification
        val prioritized = categorized.sortedByDescending { it.priority }
        
        // Auto-respond to simple emails
        val autoResponses = mutableListOf<EmailResponse>()
        for (email in categorized) {
            if (canAutoRespond(email)) {
                val response = generateResponse(email)
                autoResponses.add(response)
                sendEmail(email.from, response.subject, response.body)
            }
        }
        
        // Draft responses for complex emails
        val drafts = categorized
            .filter { it.priority >= 8 && !canAutoRespond(it) }
            .map { email ->
                val draft = generateEmailDraft(email)
                EmailDraft(
                    originalEmail = email,
                    draftSubject = draft.subject,
                    draftBody = draft.body,
                    suggestedTone = draft.tone
                )
            }
        
        return EmailManagement(
            total = emails.size,
            urgent = categorized.count { it.priority >= 9 },
            important = categorized.count { it.priority >= 7 },
            autoResponded = autoResponses.size,
            drafts = drafts,
            spam = categorized.count { it.category == "spam" }
        )
    }
    
    // Meeting preparation
    suspend fun prepareMeeting(meeting: Meeting): MeetingPreparation {
        
        val prompt = """
        Prepare for upcoming meeting:
        
        Meeting: ${meeting.title}
        Time: ${meeting.startTime}
        Attendees: ${meeting.attendees.joinToString(", ")}
        Agenda: ${meeting.agenda}
        
        Previous meetings context:
        ${getPreviousMeetings(meeting.topic)}
        
        Related emails:
        ${getRelatedEmails(meeting.topic)}
        
        Related documents:
        ${getRelatedDocuments(meeting.topic)}
        
        Generate:
        1. Executive summary of context
        2. Key discussion points
        3. Suggested talking points
        4. Potential questions to ask
        5. Action items from previous meetings
        6. Documents to review/share
        """
        
        val preparation = Claude5.complete(prompt)
        
        return MeetingPreparation(
            meeting = meeting,
            summary = preparation,
            documents = getRelatedDocuments(meeting.topic),
            previousNotes = getPreviousMeetingNotes(meeting.topic),
            suggestedAgenda = generateAgenda(meeting),
            talkingPoints = extractTalkingPoints(preparation)
        )
    }
    
    // Auto-generate meeting notes
    suspend fun takeMeetingNotes(
        meeting: Meeting,
        audioRecording: File
    ): MeetingNotes {
        
        // Transcribe audio
        val transcript = transcribeAudio(audioRecording)
        
        // AI summarization
        val prompt = """
        Meeting: ${meeting.title}
        Attendees: ${meeting.attendees.joinToString(", ")}
        
        Transcript:
        ${transcript}
        
        Generate comprehensive meeting notes including:
        1. Executive summary
        2. Key discussion points
        3. Decisions made
        4. Action items (who, what, when)
        5. Follow-up questions
        6. Next steps
        """
        
        val notes = GPT5.complete(prompt)
        
        // Extract action items
        val actionItems = extractActionItems(notes)
        
        // Create tasks from action items
        for (item in actionItems) {
            createTask(
                title = item.task,
                assignee = item.assignee,
                deadline = item.deadline,
                project = meeting.project
            )
        }
        
        // Send notes to attendees
        sendMeetingNotes(meeting.attendees, notes)
        
        return MeetingNotes(
            meeting = meeting,
            transcript = transcript,
            summary = notes,
            actionItems = actionItems,
            attendees = meeting.attendees,
            duration = meeting.duration
        )
    }
    
    // Document automation
    suspend fun createDocument(
        type: String, // report, proposal, memo, invoice
        content: DocumentContent
    ): Document {
        
        val template = getTemplate(type)
        
        val prompt = """
        Create a professional ${type} document.
        
        Content:
        ${content}
        
        Template structure:
        ${template}
        
        Generate complete document with:
        1. Professional formatting
        2. Proper sections
        3. Executive summary
        4. Data visualization suggestions
        5. Professional language
        """
        
        val documentText = Claude5.complete(prompt)
        
        // Create Word document
        val docFile = createWordDocument(documentText, template)
        
        // Create PDF version
        val pdfFile = convertToPDF(docFile)
        
        return Document(
            type = type,
            title = content.title,
            content = documentText,
            wordFile = docFile,
            pdfFile = pdfFile,
            createdAt = LocalDateTime.now()
        )
    }
    
    // Smart task management
    suspend fun manageTasks(userId: String): TaskManagement {
        
        val tasks = getAllTasks(userId)
        
        // AI prioritization
        val prioritized = tasks.map { task ->
            val priority = calculateTaskPriority(task)
            task.copy(aiPriority = priority)
        }.sortedByDescending { it.aiPriority }
        
        // Suggest task schedule
        val schedule = generateTaskSchedule(prioritized)
        
        // Identify blockers
        val blockers = identifyBlockers(prioritized)
        
        // Suggest delegation
        val delegatable = prioritized.filter { it.canDelegate }
        
        return TaskManagement(
            totalTasks = tasks.size,
            prioritized = prioritized,
            schedule = schedule,
            blockers = blockers,
            delegatable = delegatable,
            estimatedCompletionTime = calculateCompletionTime(prioritized)
        )
    }
    
    // Expense management
    suspend fun manageExpenses(userId: String): ExpenseManagement {
        
        // OCR receipt scanning
        val receipts = scanReceipts(userId)
        
        // Auto-categorize expenses
        val categorized = receipts.map { receipt ->
            val category = categorizeExpense(receipt)
            Expense(
                date = receipt.date,
                amount = receipt.total,
                category = category,
                merchant = receipt.merchant,
                description = receipt.description,
                receiptImage = receipt.image
            )
        }
        
        // Generate expense report
        val report = generateExpenseReport(categorized)
        
        // Submit for reimbursement
        val reimbursements = categorized
            .filter { it.isReimbursable }
            .map { expense ->
                submitReimbursement(expense)
            }
        
        return ExpenseManagement(
            totalExpenses = categorized.size,
            totalAmount = categorized.sumOf { it.amount },
            byCategory = categorized.groupBy { it.category },
            report = report,
            pendingReimbursements = reimbursements
        )
    }
}

// Data models
data class MorningBriefing(
    val date: LocalDate,
    val summary: String,
    val audioUrl: String,
    val calendar: List<CalendarEvent>,
    val emails: List<Email>,
    val tasks: List<Task>,
    val meetings: List<Meeting>,
    val deadlines: List<Deadline>,
    val weather: Weather,
    val traffic: TrafficInfo
)

data class EmailManagement(
    val total: Int,
    val urgent: Int,
    val important: Int,
    val autoResponded: Int,
    val drafts: List<EmailDraft>,
    val spam: Int
)

data class MeetingPreparation(
    val meeting: Meeting,
    val summary: String,
    val documents: List<Document>,
    val previousNotes: List<MeetingNotes>,
    val suggestedAgenda: String,
    val talkingPoints: List<String>
)
```

---

## 🏠 7. HOUSEHOLD PROBLEM SOLVING

### **A. AI Home Assistant**

```kotlin
// Comprehensive household problem solver

class HouseholdAssistant {
    
    // General problem solving
    suspend fun solveProblem(
        problem: String,
        category: String? = null,
        urgency: String = "normal"
    ): ProblemSolution {
        
        // Analyze problem with AI
        val analysis = analyzeProblem(problem)
        
        val prompt = """
        Household Problem:
        ${problem}
        
        Category: ${category ?: analysis.category}
        Urgency: ${urgency}
        
        Provide comprehensive solution including:
        1. Problem diagnosis
        2. Step-by-step solution
        3. Required tools/materials
        4. Estimated time
        5. Cost estimate
        6. Safety warnings
        7. When to call professional
        8. Prevention tips
        9. Alternative solutions
        10. Video tutorial links
        
        Be practical, safe, and detailed.
        """
        
        val solution = TrinityCore.complete(prompt)
        
        // Add visual guides
        val videos = findTutorialVideos(problem)
        val diagrams = generateDiagrams(solution)
        
        // Check if need professional
        val needsProfessional = assessProfessionalNeed(problem, analysis)
        
        if (needsProfessional) {
            // Find nearby professionals
            val professionals = findProfessionals(analysis.category)
            return ProblemSolution(
                problem = problem,
                analysis = analysis,
                solution = solution,
                videos = videos,
                diagrams = diagrams,
                needsProfessional = true,
                professionals = professionals
            )
        }
        
        // DIY solution
        return ProblemSolution(
            problem = problem,
            analysis = analysis,
            solution = solution,
            videos = videos,
            diagrams = diagrams,
            needsProfessional = false,
            professionals = emptyList()
        )
    }
    
    // Specific problem categories
    
    // 1. PLUMBING ISSUES
    suspend fun solvePlumbing(issue: String): PlumbingSolution {
        val commonIssues = mapOf(
            "clogged drain" to """
                Solution for Clogged Drain:
                
                Tools needed:
                - Plunger
                - Drain snake
                - Baking soda
                - Vinegar
                - Hot water
                
                Steps:
                1. Try plunger first (20-30 pumps)
                2. If still clogged, pour baking soda (1 cup)
                3. Add vinegar (1 cup), wait 30 minutes
                4. Flush with hot water
                5. If persists, use drain snake
                6. For severe clogs, call plumber
                
                Cost: Rp 50,000 (DIY) vs Rp 300,000 (plumber)
                Time: 30-60 minutes
            """,
            
            "leaky faucet" to """
                Solution for Leaky Faucet:
                
                Tools needed:
                - Adjustable wrench
                - Replacement washer/O-ring
                - Plumber's tape
                
                Steps:
                1. Turn off water supply
                2. Remove faucet handle
                3. Replace worn washer/O-ring
                4. Apply plumber's tape to threads
                5. Reassemble faucet
                6. Test for leaks
                
                Cost: Rp 20,000-50,000 (parts)
                Time: 30 minutes
            """,
            
            "low water pressure" to """
                Solution for Low Water Pressure:
                
                Possible causes:
                1. Clogged aerator (clean or replace)
                2. Closed valve (check main valve)
                3. Pipe corrosion (call plumber)
                4. Municipal issue (check with neighbors)
                
                DIY fix:
                1. Clean faucet aerator
                2. Check all valves are fully open
                3. Test at multiple faucets
                
                If problem persists: Call plumber
            """
        )
        
        // Match issue or use AI
        val solution = commonIssues[issue.lowercase()] 
            ?: solveProblem(issue, "plumbing").solution
        
        return PlumbingSolution(
            issue = issue,
            solution = solution,
            videoUrl = findVideo("plumbing $issue"),
            professionals = findPlumbers()
        )
    }
    
    // 2. ELECTRICAL ISSUES
    suspend fun solveElectrical(issue: String): ElectricalSolution {
        
        // SAFETY WARNING for electrical
        val safetyWarning = """
        ⚠️ ELECTRICAL SAFETY WARNING ⚠️
        
        Before attempting any electrical work:
        1. Turn OFF main circuit breaker
        2. Test with voltage tester
        3. Never work on live circuits
        4. If unsure, CALL ELECTRICIAN
        5. Electrical shock can be FATAL
        """
        
        val commonIssues = mapOf(
            "circuit breaker trips" to """
                Causes:
                1. Overloaded circuit (too many devices)
                2. Short circuit
                3. Ground fault
                
                Solution:
                1. Unplug all devices on circuit
                2. Reset breaker
                3. Plug devices one by one
                4. If trips immediately: Short circuit → CALL ELECTRICIAN
                5. If trips with specific device: Device problem
                
                Prevention:
                - Don't overload outlets
                - Use surge protectors
                - Upgrade panel if needed
            """,
            
            "outlet not working" to """
                Troubleshooting:
                1. Check circuit breaker (reset if tripped)
                2. Test with different device
                3. Check GFCI outlet (press reset button)
                4. If still dead: Wiring issue → CALL ELECTRICIAN
                
                DIY Safety Limit:
                - Resetting breaker: ✅ Safe
                - Replacing outlet: ⚠️ Only if experienced
                - Wiring repair: ❌ Call electrician
            """,
            
            "flickering lights" to """
                Possible causes:
                1. Loose bulb (tighten)
                2. Loose connection (DANGEROUS)
                3. Voltage fluctuation
                4. Overloaded circuit
                
                Safe DIY:
                1. Tighten bulb
                2. Try different bulb
                3. Check if other lights flicker
                
                Call electrician if:
                - Multiple lights flicker
                - Burning smell
                - Outlets warm to touch
                - Sparking
            """
        )
        
        val solution = commonIssues[issue.lowercase()]
            ?: solveProblem(issue, "electrical").solution
        
        return ElectricalSolution(
            issue = issue,
            safetyWarning = safetyWarning,
            solution = solution,
            requiresProfessional = assessElectricalDanger(issue),
            professionals = findElectricians()
        )
    }
    
    // 3. APPLIANCE REPAIR
    suspend fun solveAppliance(
        appliance: String,
        issue: String
    ): ApplianceSolution {
        
        val prompt = """
        Appliance: ${appliance}
        Issue: ${issue}
        
        Provide troubleshooting guide:
        1. Common causes
        2. DIY fixes (if safe)
        3. Parts needed
        4. Estimated cost
        5. When to replace vs repair
        6. Warranty check steps
        """
        
        val solution = Claude5.complete(prompt)
        
        // Check warranty
        val warranty = checkWarranty(appliance)
        
        // Find repair service
        val repairServices = findApplianceRepair(appliance)
        
        // Cost comparison
        val repairCost = estimateRepairCost(appliance, issue)
        val replacementCost = getReplacementCost(appliance)
        
        return ApplianceSolution(
            appliance = appliance,
            issue = issue,
            solution = solution,
            warranty = warranty,
            repairCost = repairCost,
            replacementCost = replacementCost,
            recommendation = if (repairCost > replacementCost * 0.5) "Replace" else "Repair",
            repairServices = repairServices
        )
    }
    
    // 4. CLEANING & MAINTENANCE
    suspend fun getCleaningAdvice(
        item: String,
        stainType: String? = null
    ): CleaningAdvice {
        
        val prompt = """
        Item to clean: ${item}
        ${if (stainType != null) "Stain type: $stainType" else ""}
        
        Provide cleaning guide:
        1. Recommended cleaning products
        2. Step-by-step instructions
        3. Do's and Don'ts
        4. Stain removal techniques
        5. Preventive care
        6. How often to clean
        """
        
        val advice = GPT5.complete(prompt)
        
        // Product recommendations
        val products = recommendCleaningProducts(item, stainType)
        
        return CleaningAdvice(
            item = item,
            stainType = stainType,
            advice = advice,
            products = products,
            estimatedTime = estimateCleaningTime(item),
            difficulty = assessDifficulty(item)
        )
    }
    
    // 5. PEST CONTROL
    suspend fun solvePestProblem(
        pestType: String,
        location: String
    ): PestSolution {
        
        val prompt = """
        Pest: ${pestType}
        Location: ${location}
        
        Provide pest control solution:
        1. Identify pest behavior
        2. Natural remedies
        3. Chemical solutions (if needed)
        4. Prevention methods
        5. When to call exterminator
        6. Health & safety precautions
        """
        
        val solution = TrinityCore.complete(prompt)
        
        // Product recommendations
        val products = recommendPestControl(pestType)
        
        // Find professional exterminators
        val exterminators = findExterminators()
        
        return PestSolution(
            pestType = pestType,
            location = location,
            solution = solution,
            products = products,
            needsProfessional = isPestProfessionalNeeded(pestType),
            exterminators = exterminators
        )
    }
    
    // 6. HOME MAINTENANCE SCHEDULE
    suspend fun generateMaintenanceSchedule(
        homeDetails: HomeDetails
    ): MaintenanceSchedule {
        
        val tasks = mutableListOf<MaintenanceTask>()
        
        // Monthly tasks
        tasks.addAll(listOf(
            MaintenanceTask("Clean AC filters", "monthly", "15 min", "Rp 0"),
            MaintenanceTask("Check smoke detectors", "monthly", "5 min", "Rp 0"),
            MaintenanceTask("Clean drains", "monthly", "30 min", "Rp 20,000"),
            MaintenanceTask("Inspect plumbing", "monthly", "20 min", "Rp 0")
        ))
        
        // Quarterly tasks
        tasks.addAll(listOf(
            MaintenanceTask("Service AC", "quarterly", "1 hour", "Rp 150,000"),
            MaintenanceTask("Clean gutters", "quarterly", "45 min", "Rp 100,000"),
            MaintenanceTask("Check roof", "quarterly", "30 min", "Rp 0"),
            MaintenanceTask("Pest inspection", "quarterly", "1 hour", "Rp 200,000")
        ))
        
        // Annual tasks
        tasks.addAll(listOf(
            MaintenanceTask("Service water heater", "yearly", "2 hours", "Rp 300,000"),
            MaintenanceTask("Check electrical panel", "yearly", "1 hour", "Rp 250,000"),
            MaintenanceTask("Deep clean carpets", "yearly", "3 hours", "Rp 500,000"),
            MaintenanceTask("Repaint walls", "yearly", "varies", "Rp 5,000,000")
        ))
        
        // Auto-schedule reminders
        for (task in tasks) {
            scheduleReminder(task)
        }
        
        return MaintenanceSchedule(
            homeDetails = homeDetails,
            tasks = tasks,
            annualCost = calculateAnnualCost(tasks),
            nextDue = tasks.filter { it.isUpcoming() }.sortedBy { it.dueDate }
        )
    }
    
    // 7. SMART HOME TROUBLESHOOTING
    suspend fun troubleSmartHome(
        device: String,
        issue: String
    ): SmartHomeSolution {
        
        val commonFixes = mapOf(
            "won't connect" to """
                Troubleshooting Steps:
                1. Check WiFi connection
                2. Restart device (unplug 30 seconds)
                3. Restart router
                4. Check app permissions
                5. Re-pair device
                6. Update firmware
                7. Reset to factory settings (last resort)
            """,
            
            "not responding" to """
                Quick Fixes:
                1. Power cycle device
                2. Check voice assistant connection
                3. Verify device is online in app
                4. Check internet connection
                5. Update app
                6. Reconnect to WiFi
            """,
            
            "slow response" to """
                Performance Improvements:
                1. Move closer to router
                2. Reduce WiFi interference
                3. Update firmware
                4. Reduce connected devices
                5. Upgrade internet speed
                6. Use WiFi extender
            """
        )
        
        val solution = commonFixes[issue.lowercase()]
            ?: solveProblem("${device} ${issue}", "smart_home").solution
        
        return SmartHomeSolution(
            device = device,
            issue = issue,
            solution = solution,
            videoUrl = findVideo("${device} troubleshooting"),
            supportContact = getDeviceSupport(device)
        )
    }
}

// Data models
data class ProblemSolution(
    val problem: String,
    val analysis: ProblemAnalysis,
    val solution: String,
    val videos: List<VideoTutorial>,
    val diagrams: List<String>,
    val needsProfessional: Boolean,
    val professionals: List<Professional>
)

data class PlumbingSolution(
    val issue: String,
    val solution: String,
    val videoUrl: String,
    val professionals: List<Plumber>
)

data class ElectricalSolution(
    val issue: String,
    val safetyWarning: String,
    val solution: String,
    val requiresProfessional: Boolean,
    val professionals: List<Electrician>
)

data class MaintenanceTask(
    val name: String,
    val frequency: String,
    val duration: String,
    val cost: String,
    var dueDate: LocalDate? = null,
    var completed: Boolean = false
) {
    fun isUpcoming(): Boolean {
        return dueDate?.let { it.isBefore(LocalDate.now().plusDays(7)) } ?: false
    }
}
```

---

## 🗄️ DATABASE SCHEMA

```sql
-- Transportation Orders
CREATE TABLE transportation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider VARCHAR(50) NOT NULL, -- 'gojek', 'grab', 'taxi'
    service VARCHAR(50) NOT NULL, -- 'goride', 'gocar', 'grabbike', etc.
    order_id VARCHAR(255) UNIQUE, -- Provider's order ID
    pickup_location JSONB NOT NULL,
    dropoff_location JSONB NOT NULL,
    pickup_time TIMESTAMP,
    dropoff_time TIMESTAMP,
    driver_info JSONB,
    vehicle_info JSONB,
    price DECIMAL(10, 2),
    status VARCHAR(50), -- 'pending', 'finding_driver', 'driver_found', 'in_progress', 'completed', 'cancelled'
    payment_method VARCHAR(50),
    rating INTEGER, -- 1-5 stars
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Food Orders
CREATE TABLE food_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    platform VARCHAR(50) NOT NULL, -- 'gofood', 'grabfood', 'shopeefood'
    order_id VARCHAR(255) UNIQUE,
    restaurant_id VARCHAR(255),
    restaurant_name VARCHAR(255),
    items JSONB NOT NULL, -- Array of menu items
    subtotal DECIMAL(10, 2),
    delivery_fee DECIMAL(10, 2),
    service_fee DECIMAL(10, 2),
    discount DECIMAL(10, 2),
    total DECIMAL(10, 2),
    delivery_address JSONB,
    delivery_time TIMESTAMP,
    driver_info JSONB,
    status VARCHAR(50),
    rating INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Restaurant Reservations
CREATE TABLE restaurant_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    restaurant_id VARCHAR(255),
    restaurant_name VARCHAR(255),
    restaurant_address TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guests INTEGER NOT NULL,
    guest_name VARCHAR(255),
    guest_phone VARCHAR(20),
    guest_email VARCHAR(255),
    special_requests TEXT,
    confirmation_code VARCHAR(50),
    status VARCHAR(50), -- 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hotel Bookings
CREATE TABLE hotel_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    booking_platform VARCHAR(50), -- 'booking.com', 'agoda', 'traveloka', 'tiket.com'
    booking_id VARCHAR(255) UNIQUE,
    hotel_id VARCHAR(255),
    hotel_name VARCHAR(255),
    hotel_address TEXT,
    room_type VARCHAR(255),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER NOT NULL,
    guests JSONB NOT NULL,
    room_price DECIMAL(12, 2),
    taxes DECIMAL(12, 2),
    total DECIMAL(12, 2),
    payment_status VARCHAR(50),
    confirmation_code VARCHAR(50),
    cancellation_policy TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Flight Bookings
CREATE TABLE flight_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    booking_platform VARCHAR(50),
    booking_reference VARCHAR(50) UNIQUE,
    airline VARCHAR(255),
    flight_number VARCHAR(50),
    departure_airport VARCHAR(50),
    arrival_airport VARCHAR(50),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    passengers JSONB NOT NULL,
    cabin VARCHAR(50), -- 'economy', 'business', 'first'
    baggage VARCHAR(255),
    price DECIMAL(12, 2),
    payment_status VARCHAR(50),
    ticket_issued BOOLEAN DEFAULT false,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Travel Itineraries
CREATE TABLE travel_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    destination VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    budget DECIMAL(12, 2),
    travelers INTEGER,
    itinerary_data JSONB NOT NULL, -- Complete itinerary structure
    flights JSONB,
    hotels JSONB,
    restaurants JSONB,
    activities JSONB,
    transportation JSONB,
    total_cost DECIMAL(12, 2),
    status VARCHAR(50), -- 'planning', 'booked', 'in_progress', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Office Tasks
CREATE TABLE office_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 5, -- 1-10
    ai_priority INTEGER, -- AI-calculated priority
    status VARCHAR(50) DEFAULT 'pending',
    project VARCHAR(255),
    assignee VARCHAR(255),
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    tags TEXT[],
    dependencies TEXT[], -- IDs of dependent tasks
    can_delegate BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Meeting Notes
CREATE TABLE meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    meeting_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    attendees TEXT[],
    transcript TEXT,
    summary TEXT NOT NULL,
    key_points TEXT[],
    decisions TEXT[],
    action_items JSONB,
    recording_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Household Problems
CREATE TABLE household_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    category VARCHAR(50), -- 'plumbing', 'electrical', 'appliance', etc.
    problem_description TEXT NOT NULL,
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'emergency'
    solution TEXT,
    diy_possible BOOLEAN,
    professional_needed BOOLEAN,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    status VARCHAR(50), -- 'reported', 'diagnosed', 'in_progress', 'resolved'
    professional_id UUID,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Home Maintenance Schedule
CREATE TABLE maintenance_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    task_name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    frequency VARCHAR(50), -- 'monthly', 'quarterly', 'yearly'
    last_completed DATE,
    next_due DATE,
    estimated_duration VARCHAR(50),
    estimated_cost DECIMAL(10, 2),
    instructions TEXT,
    reminder_days INTEGER DEFAULT 7,
    auto_schedule BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Service Professionals
CREATE TABLE service_professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'plumber', 'electrician', 'cleaner', etc.
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    service_area TEXT[],
    rating DECIMAL(3, 2),
    review_count INTEGER,
    average_price DECIMAL(10, 2),
    available_24_7 BOOLEAN DEFAULT false,
    emergency_service BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_transportation_user_date ON transportation_orders(user_id, created_at DESC);
CREATE INDEX idx_food_orders_user_date ON food_orders(user_id, created_at DESC);
CREATE INDEX idx_hotel_bookings_checkin ON hotel_bookings(user_id, check_in);
CREATE INDEX idx_flight_bookings_departure ON flight_bookings(user_id, departure_time);
CREATE INDEX idx_travel_itineraries_dates ON travel_itineraries(user_id, start_date, end_date);
CREATE INDEX idx_office_tasks_user_priority ON office_tasks(user_id, ai_priority DESC, due_date);
CREATE INDEX idx_household_problems_user_status ON household_problems(user_id, status, created_at DESC);
CREATE INDEX idx_professionals_category ON service_professionals(category, rating DESC);
```

---

## 🎨 FRONTEND UI COMPONENTS

### **Life Assistant Dashboard**

```typescript
// frontend/web/src/components/life-assistant/LifeAssistantDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useLifeAssistant } from '@/hooks/useLifeAssistant';

const LifeAssistantDashboard: React.FC = () => {
  const {
    morningBriefing,
    activeTasks,
    upcomingTrips,
    pendingOrders,
    householdIssues,
    getMorningBriefing,
    orderRide,
    orderFood,
    solveProblem
  } = useLifeAssistant();

  useEffect(() => {
    // Load morning briefing
    getMorningBriefing();
  }, []);

  return (
    <div className="life-assistant-dashboard">
      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button onClick={() => orderRide()} className="action-btn">
            🚗 Order Ride
          </button>
          <button onClick={() => orderFood()} className="action-btn">
            🍔 Order Food
          </button>
          <button className="action-btn">
            🏨 Book Hotel
          </button>
          <button className="action-btn">
            ✈️ Book Flight
          </button>
          <button className="action-btn">
            🏝️ Plan Trip
          </button>
          <button onClick={() => solveProblem()} className="action-btn">
            🔧 Fix Problem
          </button>
        </div>
      </div>

      {/* Morning Briefing */}
      {morningBriefing && (
        <div className="morning-briefing-card">
          <h2>☀️ Morning Briefing</h2>
          <div className="briefing-content">
            <p>{morningBriefing.summary}</p>
            <audio controls src={morningBriefing.audioUrl} />
            
            <div className="briefing-stats">
              <div className="stat">
                <span className="label">Meetings Today</span>
                <span className="value">{morningBriefing.meetings.length}</span>
              </div>
              <div className="stat">
                <span className="label">Pending Tasks</span>
                <span className="value">{morningBriefing.tasks.length}</span>
              </div>
              <div className="stat">
                <span className="label">Unread Emails</span>
                <span className="value">{morningBriefing.emails.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Orders */}
      {pendingOrders.length > 0 && (
        <div className="active-orders">
          <h2>🚀 Active Orders</h2>
          {pendingOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-icon">
                {order.type === 'ride' && '🚗'}
                {order.type === 'food' && '🍔'}
              </div>
              <div className="order-details">
                <h3>{order.title}</h3>
                <p className="status">{order.status}</p>
                <p className="eta">ETA: {order.eta}</p>
              </div>
              <button className="track-btn">Track</button>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <div className="upcoming-trips">
          <h2>✈️ Upcoming Trips</h2>
          {upcomingTrips.map(trip => (
            <div key={trip.id} className="trip-card">
              <div className="trip-image">
                <img src={trip.imageUrl} alt={trip.destination} />
              </div>
              <div className="trip-details">
                <h3>{trip.destination}</h3>
                <p>{trip.startDate} - {trip.endDate}</p>
                <p>{trip.days} days</p>
              </div>
              <button className="view-btn">View Itinerary</button>
            </div>
          ))}
        </div>
      )}

      {/* Household Issues */}
      {householdIssues.length > 0 && (
        <div className="household-issues">
          <h2>🏠 Household Issues</h2>
          {householdIssues.map(issue => (
            <div key={issue.id} className="issue-card">
              <div className="issue-icon">
                {issue.category === 'plumbing' && '🚰'}
                {issue.category === 'electrical' && '⚡'}
                {issue.category === 'appliance' && '🔌'}
              </div>
              <div className="issue-details">
                <h3>{issue.problem}</h3>
                <span className={`severity ${issue.severity}`}>
                  {issue.severity}
                </span>
                <p className="status">{issue.status}</p>
              </div>
              <button className="solve-btn">View Solution</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LifeAssistantDashboard;
```

---

**(Dokumentasi berlanjut di Summary...)**
