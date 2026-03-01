# 💼 NEOBOT V7 - DIGITAL BUSINESS EXPERT (PART 2)
## E-commerce, Development, Design, Data & Infrastructure

---

## 🛒 2. E-COMMERCE EXPERT

### **A. E-commerce Store Setup & Optimization**

```kotlin
// E-commerce Expert System

class EcommerceExpert {
    
    // Complete store setup
    suspend fun setupEcommerceStore(
        businessInfo: BusinessInfo,
        platform: String, // shopify, woocommerce, magento
        niche: String
    ): EcommerceSetup {
        
        val prompt = """
        Create complete e-commerce store setup plan:
        
        Business: ${businessInfo.name}
        Platform: ${platform}
        Niche: ${niche}
        Target Market: ${businessInfo.targetMarket}
        
        Provide comprehensive setup including:
        
        1. STORE STRUCTURE
           - Homepage design (hero, featured products, USPs)
           - Category architecture (SEO-friendly)
           - Product page templates
           - Collection pages
           - Search functionality
           - Filters & sorting
        
        2. PRODUCT STRATEGY
           - Product descriptions (SEO + conversion)
           - Product photography guidelines
           - Pricing strategy (competitive + profitable)
           - Inventory management
           - Variants handling (size, color, etc.)
        
        3. CONVERSION OPTIMIZATION
           - Trust signals (reviews, badges, guarantees)
           - Cart abandonment recovery
           - Urgency tactics (limited stock, countdown)
           - Social proof integration
           - Upsell/cross-sell strategies
           - Checkout optimization (reduce friction)
        
        4. PAYMENT & SHIPPING
           - Payment gateway setup (Stripe, PayPal, etc.)
           - Shipping zones & rates
           - Free shipping threshold
           - International shipping
           - Returns policy
        
        5. MARKETING INTEGRA TION
           - Email marketing (Klaviyo setup)
           - SMS marketing
           - Retargeting pixels (Facebook, Google)
           - Loyalty program
           - Referral program
           - Affiliate program
        
        6. TECHNICAL SETUP
           - SSL certificate
           - Page speed optimization
           - Mobile optimization
           - SEO fundamentals
           - Analytics tracking (GA4, events)
           - Conversion tracking
        
        7. LEGAL & COMPLIANCE
           - Privacy policy
           - Terms & conditions
           - GDPR compliance
           - Cookie consent
           - Tax setup
        """
        
        val setup = TrinityCore.complete(prompt)
        
        return EcommerceSetup(
            platform = platform,
            storeStructure = extractStoreStructure(setup),
            productStrategy = extractProductStrategy(setup),
            conversionOptimization = extractConversionTactics(setup),
            paymentShipping = extractPaymentShipping(setup),
            marketingIntegration = extractMarketing(setup),
            technicalSetup = extractTechnical(setup),
            legalCompliance = extractLegal(setup),
            estimatedTimeline = "2-4 weeks",
            estimatedCost = calculateSetupCost(platform)
        )
    }
    
    // Product description generation
    suspend fun generateProductDescription(
        product: ProductInfo,
        targetAudience: String
    ): ProductDescription {
        
        val prompt = """
        Write high-converting product description:
        
        Product: ${product.name}
        Category: ${product.category}
        Features: ${product.features.joinToString(", ")}
        Benefits: ${product.benefits.joinToString(", ")}
        Target Audience: ${targetAudience}
        Price: ${product.price}
        
        Create description with:
        
        1. HEADLINE (compelling, benefit-driven)
        2. OPENING (hook that addresses pain point)
        3. FEATURES & BENEFITS
           - Transform features into benefits
           - Use bullet points
           - Focus on outcomes
        4. SOCIAL PROOF
           - Customer testimonials
           - Ratings mention
           - Usage statistics
        5. URGENCY & SCARCITY
           - Limited stock
           - Time-limited offer
           - High demand
        6. GUARANTEE
           - Money-back guarantee
           - Free returns
           - Warranty info
        7. CALL-TO-ACTION
           - Clear, action-oriented
           - Multiple CTAs
        
        SEO Requirements:
        - Include primary keyword 3-5 times
        - LSI keywords naturally
        - 300-500 words
        - Scannable format
        
        Tone: ${if (product.category.contains("luxury")) "Premium, sophisticated" else "Friendly, enthusiastic"}
        """
        
        val description = GPT5.complete(prompt)
        
        return ProductDescription(
            headline = extractHeadline(description),
            description = description,
            bulletPoints = extractBulletPoints(description),
            seoKeywords = extractKeywords(description),
            expectedConversionLift = "15-25%"
        )
    }
    
    // Conversion rate optimization
    suspend fun optimizeConversionRate(
        storeUrl: String,
        currentCR: Double
    ): CROPlan {
        
        // Analyze store
        val analysis = analyzeStore(storeUrl)
        
        val prompt = """
        Optimize conversion rate for e-commerce store:
        
        Store: ${storeUrl}
        Current CR: ${currentCR}%
        Industry Average: ${getIndustryAverage(analysis.category)}%
        
        Analysis:
        - Traffic: ${analysis.traffic}
        - Bounce Rate: ${analysis.bounceRate}%
        - Cart Abandonment: ${analysis.cartAbandonment}%
        - Avg Order Value: $${analysis.avgOrderValue}
        - Page Speed: ${analysis.pageSpeed}s
        
        Provide optimization plan:
        
        1. QUICK WINS (implement this week)
           - High-impact, low-effort changes
           - Expected lift: 5-10%
        
        2. HOMEPAGE OPTIMIZATION
           - Hero section improvements
           - Value proposition clarity
           - Trust signals
           - Featured products
        
        3. PRODUCT PAGE OPTIMIZATION
           - Image quality & quantity
           - Description improvements
           - Reviews prominence
           - Add-to-cart button
           - Size/variant selection
        
        4. CART & CHECKOUT
           - Cart abandonment email sequence
           - Checkout step reduction
           - Guest checkout option
           - Payment options
           - Security badges
        
        5. MOBILE OPTIMIZATION
           - Mobile speed improvements
           - Touch-friendly buttons
           - Simplified navigation
           - Mobile checkout
        
        6. A/B TESTING ROADMAP
           - Test priorities
           - Hypothesis for each test
           - Expected impact
           - Implementation order
        
        7. PSYCHOLOGICAL TRIGGERS
           - Scarcity (limited stock)
           - Urgency (countdown timers)
           - Social proof (customer count)
           - Authority (badges, certifications)
        
        Target CR: ${currentCR * 1.5}% (50% improvement)
        Timeline: 90 days
        """
        
        val plan = Claude5.complete(prompt)
        
        return CROPlan(
            currentCR = currentCR,
            targetCR = currentCR * 1.5,
            quickWins = extractQuickWins(plan),
            optimizations = extractOptimizations(plan),
            abTestRoadmap = extractABTests(plan),
            expectedLift = 50, // %
            timeline = 90 // days
        )
    }
    
    // Multi-marketplace strategy
    suspend fun createMarketplaceStrategy(
        products: List<Product>,
        targetMarkets: List<String>
    ): MarketplaceStrategy {
        
        val marketplaces = listOf(
            "Shopee", "Tokopedia", "Lazada", "Bukalapak",
            "Amazon", "eBay", "Etsy", "AliExpress"
        )
        
        val strategy = marketplaces.map { marketplace ->
            val analysis = analyzeMarketplace(marketplace, products, targetMarkets)
            
            MarketplacePlan(
                marketplace = marketplace,
                suitability = analysis.suitability,
                competition = analysis.competition,
                commission = analysis.commission,
                productFit = analysis.productFit,
                setupSteps = generateSetupSteps(marketplace),
                pricingStrategy = generatePricingStrategy(marketplace, products),
                promotionStrategy = generatePromotionStrategy(marketplace),
                expectedRevenue = calculateExpectedRevenue(marketplace, products),
                priority = calculatePriority(analysis)
            )
        }.sortedByDescending { it.priority }
        
        return MarketplaceStrategy(
            plans = strategy,
            launchSequence = generateLaunchSequence(strategy),
            integrationTools = recommendIntegrationTools(strategy)
        )
    }
}

// Data models
data class EcommerceSetup(
    val platform: String,
    val storeStructure: StoreStructure,
    val productStrategy: ProductStrategy,
    val conversionOptimization: ConversionTactics,
    val paymentShipping: PaymentShipping,
    val marketingIntegration: MarketingIntegration,
    val technicalSetup: TechnicalSetup,
    val legalCompliance: LegalCompliance,
    val estimatedTimeline: String,
    val estimatedCost: Double
)

data class CROPlan(
    val currentCR: Double,
    val targetCR: Double,
    val quickWins: List<Optimization>,
    val optimizations: List<Optimization>,
    val abTestRoadmap: List<ABTest>,
    val expectedLift: Int, // percentage
    val timeline: Int // days
)
```

---

## 💻 3. WEB DEVELOPMENT EXPERT

### **A. Full-Stack Development**

```kotlin
// Web Development Expert System

class WebDevelopmentExpert {
    
    // Complete web application architecture
    suspend fun designWebArchitecture(
        projectRequirements: ProjectRequirements
    ): WebArchitecture {
        
        val prompt = """
        Design complete web application architecture:
        
        Project: ${projectRequirements.name}
        Type: ${projectRequirements.type} // SaaS, E-commerce, Social, etc.
        Scale: ${projectRequirements.expectedUsers} users
        Budget: $${projectRequirements.budget}
        Timeline: ${projectRequirements.timeline} months
        
        Provide comprehensive architecture:
        
        1. FRONTEND ARCHITECTURE
           - Framework: React vs Vue vs Svelte vs Next.js
           - State Management: Redux vs Zustand vs Recoil
           - Styling: Tailwind vs Material-UI vs Styled Components
           - Build Tool: Vite vs Webpack
           - TypeScript configuration
           - Component structure
           - Routing strategy
           - Authentication flow
           - API integration pattern
           - Performance optimization
           - SEO considerations
        
        2. BACKEND ARCHITECTURE
           - Framework: Node.js/Express vs Django vs Rails vs Laravel
           - API Design: REST vs GraphQL vs tRPC
           - Database: PostgreSQL vs MongoDB vs MySQL
           - Caching: Redis vs Memcached
           - Message Queue: RabbitMQ vs Kafka
           - Authentication: JWT vs Session vs OAuth
           - File Storage: S3 vs local vs CDN
           - Email Service: SendGrid vs AWS SES
           - Payment: Stripe vs PayPal integration
        
        3. DATABASE DESIGN
           - Schema design (normalized)
           - Indexes for performance
           - Relationships (1-to-1, 1-to-many, many-to-many)
           - Migration strategy
           - Backup strategy
           - Scaling plan (read replicas, sharding)
        
        4. INFRASTRUCTURE
           - Hosting: AWS vs GCP vs Azure vs Vercel
           - CI/CD: GitHub Actions vs GitLab CI vs Jenkins
           - Monitoring: Sentry vs Datadog vs New Relic
           - Logging: ELK vs CloudWatch
           - CDN: Cloudflare vs AWS CloudFront
           - SSL/TLS setup
           - Load balancing
           - Auto-scaling
        
        5. SECURITY
           - HTTPS enforcement
           - CORS configuration
           - Rate limiting
           - SQL injection prevention
           - XSS protection
           - CSRF tokens
           - Input validation
           - Password hashing (bcrypt)
           - Secrets management
        
        6. DEVELOPMENT WORKFLOW
           - Git branching strategy (GitFlow)
           - Code review process
           - Testing strategy (unit, integration, E2E)
           - Documentation standards
           - Deployment process
        
        7. PERFORMANCE
           - Page load targets (<3s)
           - API response times (<100ms)
           - Database query optimization
           - Image optimization
           - Lazy loading
           - Code splitting
           - Caching strategy
        
        Provide:
        - Tech stack recommendation with justification
        - Architecture diagrams
        - Database ERD
        - API endpoints structure
        - File structure
        - Development timeline
        - Cost estimation
        """
        
        val architecture = TrinityCore.complete(prompt)
        
        return WebArchitecture(
            techStack = extractTechStack(architecture),
            frontend = extractFrontendArch(architecture),
            backend = extractBackendArch(architecture),
            database = extractDatabaseDesign(architecture),
            infrastructure = extractInfrastructure(architecture),
            security = extractSecurityMeasures(architecture),
            developmentWorkflow = extractWorkflow(architecture),
            performanceTargets = extractPerformanceTargets(architecture),
            timeline = extractTimeline(architecture),
            estimatedCost = extractCost(architecture)
        )
    }
    
    // Code generation
    suspend fun generateCode(
        feature: String,
        techStack: TechStack,
        requirements: String
    ): GeneratedCode {
        
        val prompt = """
        Generate production-ready code for: ${feature}
        
        Tech Stack:
        - Frontend: ${techStack.frontend}
        - Backend: ${techStack.backend}
        - Database: ${techStack.database}
        
        Requirements:
        ${requirements}
        
        Generate complete, production-ready code:
        
        1. FRONTEND CODE
           - Component structure
           - TypeScript interfaces
           - API integration
           - Error handling
           - Loading states
           - Form validation
           - Responsive design
        
        2. BACKEND CODE
           - API endpoints
           - Controllers
           - Services/business logic
           - Database models
           - Validation schemas
           - Error handling
           - Authentication middleware
           - Unit tests
        
        3. DATABASE
           - Migration files
           - Seed data
           - Indexes
        
        4. TESTS
           - Unit tests (Jest/Vitest)
           - Integration tests
           - E2E tests (Playwright/Cypress)
        
        Code should be:
        - Clean & readable
        - Well-documented
        - Following best practices
        - DRY (Don't Repeat Yourself)
        - SOLID principles
        - Production-ready
        - Secure
        - Performant
        """
        
        val code = GPT5.complete(prompt)
        
        return GeneratedCode(
            feature = feature,
            frontend = extractFrontendCode(code),
            backend = extractBackendCode(code),
            database = extractDatabaseCode(code),
            tests = extractTests(code),
            documentation = extractDocumentation(code)
        )
    }
    
    // Code review & optimization
    suspend fun reviewCode(
        code: String,
        language: String,
        framework: String
    ): CodeReview {
        
        val prompt = """
        Perform comprehensive code review:
        
        Language: ${language}
        Framework: ${framework}
        
        Code:
        ${code}
        
        Review for:
        
        1. CODE QUALITY
           - Readability
           - Maintainability
           - Consistency
           - Naming conventions
           - Comments & documentation
        
        2. BEST PRACTICES
           - Design patterns
           - SOLID principles
           - DRY violations
           - Code smells
           - Framework conventions
        
        3. PERFORMANCE
           - Algorithm efficiency (Big O)
           - Database queries (N+1 problem)
           - Memory leaks
           - Unnecessary re-renders
           - Bundle size
        
        4. SECURITY
           - SQL injection vulnerabilities
           - XSS vulnerabilities
           - Authentication issues
           - Authorization issues
           - Data exposure
           - Secrets in code
        
        5. TESTING
           - Test coverage
           - Edge cases
           - Error scenarios
           - Mock quality
        
        Provide:
        - Issues found (categorized by severity)
        - Specific recommendations
        - Refactored code examples
        - Performance improvements
        - Security fixes
        """
        
        val review = Claude5.complete(prompt)
        
        return CodeReview(
            overallScore = calculateCodeScore(review),
            issues = extractIssues(review),
            recommendations = extractRecommendations(review),
            refactoredCode = extractRefactoredCode(review),
            securityFixes = extractSecurityFixes(review)
        )
    }
}
```

---

## 📱 4. MOBILE DEVELOPMENT EXPERT

```kotlin
// Mobile Development Expert System

class MobileDevelopmentExpert {
    
    // Mobile app architecture
    suspend fun designMobileApp(
        appIdea: AppIdea,
        platforms: List<String> // iOS, Android, Both
    ): MobileArchitecture {
        
        val prompt = """
        Design complete mobile app architecture:
        
        App: ${appIdea.name}
        Description: ${appIdea.description}
        Target Platforms: ${platforms.joinToString(", ")}
        Expected Users: ${appIdea.expectedUsers}
        
        Decide on approach:
        1. Native (Swift/Kotlin) - Best performance, platform-specific
        2. React Native - Code sharing, faster development
        3. Flutter - Single codebase, beautiful UI
        
        For chosen approach, provide:
        
        1. PROJECT STRUCTURE
           - Folder organization
           - Module separation
           - Navigation setup
           - State management
        
        2. TECHNICAL STACK
           - UI framework/library
           - State management (Redux, MobX, Provider)
           - Navigation (React Navigation, Flutter Navigator)
           - Networking (Axios, Dio)
           - Local storage (AsyncStorage, SQLite, Realm)
           - Authentication
           - Push notifications (FCM, APNS)
           - Analytics (Firebase, Mixpanel)
           - Crash reporting (Sentry, Crashlytics)
        
        3. FEATURES IMPLEMENTATION
           - User authentication (email, social, biometric)
           - Onboarding flow
           - Main features
           - Offline support
           - Push notifications
           - Deep linking
           - In-app purchases (if applicable)
           - App rating prompts
        
        4. PERFORMANCE OPTIMIZATION
           - Image optimization
           - Lazy loading
           - List virtualization
           - Memory management
           - Battery optimization
           - App size reduction
        
        5. TESTING STRATEGY
           - Unit tests
           - Widget/component tests
           - Integration tests
           - E2E tests
           - Device testing matrix
        
        6. DEPLOYMENT
           - iOS App Store setup
           - Google Play Store setup
           - App signing
           - Beta testing (TestFlight, Firebase Distribution)
           - Release management
           - OTA updates (CodePush)
        
        7. MONETIZATION (if applicable)
           - Subscription model
           - In-app purchases
           - Ads integration
           - Freemium strategy
        
        Recommendation:
        - Approach: [Native/React Native/Flutter]
        - Justification: [Why this approach]
        - Development timeline: [X months]
        - Team size: [X developers]
        - Cost estimate: $[amount]
        """
        
        val architecture = TrinityCore.complete(prompt)
        
        return MobileArchitecture(
            approach = extractApproach(architecture),
            justification = extractJustification(architecture),
            projectStructure = extractProjectStructure(architecture),
            techStack = extractTechStack(architecture),
            features = extractFeatures(architecture),
            performance = extractPerformance(architecture),
            testing = extractTesting(architecture),
            deployment = extractDeployment(architecture),
            timeline = extractTimeline(architecture),
            estimatedCost = extractCost(architecture)
        )
    }
    
    // Mobile app code generation
    suspend fun generateMobileCode(
        screen: String,
        platform: String,
        framework: String
    ): MobileCode {
        
        val prompt = """
        Generate production-ready mobile code:
        
        Screen: ${screen}
        Platform: ${platform}
        Framework: ${framework}
        
        Generate complete code for:
        
        ${when(framework.lowercase()) {
            "react native" -> """
                1. Component with TypeScript
                2. Styling (StyleSheet)
                3. State management (hooks)
                4. API integration
                5. Error handling
                6. Loading states
                7. Navigation props
                8. Platform-specific code (iOS/Android)
            """
            "flutter" -> """
                1. Widget with Dart
                2. State management (Provider/Riverpod)
                3. API integration
                4. Error handling
                5. Loading indicators
                6. Navigation
                7. Theme integration
            """
            "native" -> """
                1. ${if(platform == "ios") "SwiftUI View" else "Kotlin Composable"}
                2. View Model
                3. API service
                4. Data models
                5. Error handling
                6. Navigation
            """
            else -> "Framework-specific code"
        }}
        
        Code should include:
        - Responsive design
        - Accessibility features
        - Dark mode support
        - Animations
        - Gesture handling
        - Keyboard management
        """
        
        val code = GPT5.complete(prompt)
        
        return MobileCode(
            screen = screen,
            code = code,
            dependencies = extractDependencies(code),
            assets = extractRequiredAssets(code)
        )
    }
}
```

---

## 🎨 5. UI/UX DESIGN EXPERT

```kotlin
// UI/UX Design Expert System

class UIUXExpert {
    
    // Complete UX research & strategy
    suspend fun conductUXResearch(
        product: ProductInfo,
        targetUsers: UserDemographics
    ): UXResearch {
        
        val prompt = """
        Conduct comprehensive UX research:
        
        Product: ${product.name}
        Type: ${product.type}
        Target Users: ${targetUsers}
        
        Provide complete UX research plan:
        
        1. USER RESEARCH
           - User personas (3-5 detailed personas)
           - User journey maps
           - Pain points analysis
           - User needs & goals
           - User stories
        
        2. COMPETITIVE ANALYSIS
           - Direct competitors (3-5)
           - Feature comparison
           - UX strengths & weaknesses
           - Design patterns analysis
           - Opportunities & gaps
        
        3. INFORMATION ARCHITECTURE
           - Site map structure
           - Navigation hierarchy
           - Content organization
           - Search functionality
           - Filters & categorization
        
        4. USER FLOWS
           - Critical user flows (5-10)
           - Happy paths
           - Error scenarios
           - Edge cases
           - Alternative flows
        
        5. WIREFRAMES
           - Low-fidelity wireframes
           - Key screens
           - Responsive layouts
           - Interaction points
           - Annotations
        
        6. USABILITY TESTING PLAN
           - Test scenarios
           - Success metrics
           - Testing protocol
           - Recruitment criteria
           - Analysis framework
        
        7. DESIGN PRINCIPLES
           - Clarity & simplicity
           - Consistency
           - Feedback & response
           - Error prevention
           - Flexibility & efficiency
        """
        
        val research = TrinityCore.complete(prompt)
        
        return UXResearch(
            personas = extractPersonas(research),
            journeyMaps = extractJourneyMaps(research),
            competitiveAnalysis = extractCompetitive(research),
            informationArchitecture = extractIA(research),
            userFlows = extractUserFlows(research),
            wireframes = extractWireframes(research),
            testingPlan = extractTestingPlan(research),
            designPrinciples = extractPrinciples(research)
        )
    }
    
    // Design system creation
    suspend fun createDesignSystem(
        brand: BrandIdentity,
        platforms: List<String>
    ): DesignSystem {
        
        val prompt = """
        Create comprehensive design system:
        
        Brand: ${brand.name}
        Brand Colors: ${brand.colors}
        Brand Voice: ${brand.voice}
        Platforms: ${platforms.joinToString(", ")}
        
        Design complete design system:
        
        1. FOUNDATION
           - Color palette (primary, secondary, neutrals, semantic)
           - Typography (font families, sizes, weights, line heights)
           - Spacing system (4px/8px grid)
           - Breakpoints (mobile, tablet, desktop)
           - Elevation/shadows
           - Border radius scale
           - Animation/transition timing
        
        2. COMPONENTS
           - Buttons (primary, secondary, tertiary, variants)
           - Forms (inputs, textareas, selects, checkboxes, radio)
           - Navigation (header, sidebar, tabs, breadcrumbs)
           - Cards & containers
           - Modals & dialogs
           - Alerts & notifications
           - Loaders & skeletons
           - Tables & data displays
           - Charts & graphs
           - Icons & illustrations
        
        3. PATTERNS
           - Layout grids
           - Form patterns
           - Navigation patterns
           - Content patterns
           - Interaction patterns
        
        4. DOCUMENTATION
           - Usage guidelines
           - Do's and don'ts
           - Accessibility notes
           - Code snippets
           - Implementation examples
        
        5. RESPONSIVE DESIGN
           - Mobile-first approach
           - Tablet adaptations
           - Desktop layouts
           - Breakpoint behaviors
        
        6. DARK MODE
           - Color adjustments
           - Contrast requirements
           - Component variations
        
        7. ACCESSIBILITY
           - WCAG 2.1 AA compliance
           - Color contrast ratios
           - Keyboard navigation
           - Screen reader support
           - Focus indicators
        """
        
        val system = Claude5.complete(prompt)
        
        return DesignSystem(
            foundation = extractFoundation(system),
            components = extractComponents(system),
            patterns = extractPatterns(system),
            documentation = extractDocumentation(system),
            responsive = extractResponsive(system),
            darkMode = extractDarkMode(system),
            accessibility = extractAccessibility(system),
            figmaFile = generateFigmaComponents(system),
            codeExamples = generateCodeExamples(system)
        )
    }
}
```

---

**(Dokumentasi berlanjut di Part 3 dengan Data Science, Cybersecurity, Cloud, DevOps, Blockchain, dll...)**
