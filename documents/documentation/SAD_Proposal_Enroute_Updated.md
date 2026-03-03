# TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES
## QUEZON CITY
## COLLEGE OF INFORMATION TECHNOLOGY EDUCATION

# SYSTEM ANALYSIS AND DESIGN
## Project Topic Proposal

**Section:** IT32S4  
**Date Submitted:** 02/10/2026  

### Project Team
| Team Name: | Enroute Tech |
|---|---|
| Project Leader: | ALCANTARA, Ian Darick |
| Member 1: | ANDAYA, Joshua Alhjen R. |
| Member 2: | MACAPAGAL, Juaqiun Mikhail |
| Member 3: | MARQUEZ, Hannah Ysabelle C. |
| Member 4: | SUMAYOD, Lee Andre |

---

### Proposed Project # 7

| Proposed Title #7: | Enroute: AI-Powered Local Career Navigation Platform with Custom Dahlia Mentorship |
|---|---|
| **Research Area:** | Educational Technology (EdTech) × Human-Centered AI Systems × Mobile Application Development<br><br>Sub-domains: Career Development Systems, Personalized Recommendation Algorithms, Retrieval-Augmented Generation (RAG) Architecture, Ethical AI Orchestration |
| **Project Description:** | Enroute is a responsive cross-platform mobile application and administrative web portal designed to transform how students navigate career readiness. This iteration integrates a custom fine-tuned conversational AI model named "Dahlia," acting as an empathetic career mentor replacing entirely manual counseling frameworks with a highly scalable, "vibe-coded", and intelligent pipeline. |

### Core Architecture Integration Points
| Workflow | Hybrid Implementation |
|---|---|
| **AI Mentorship Engine** | Node.js/Express backend integrates with LLM APIs utilizing a RAG (Retrieval-Augmented Generation) pipeline. It queries an internal Vector Database filled with Philippine university paths and TESDA certifications to serve the mobile client. |
| **Personalized Match Trigger** | On profile save, the Express backend triggers a CV-gap analysis using custom AI prompts, immediately updating the Firebase Firestore to reflect new roadmap steps to the user. |
| **Certification Recommender** | Express backend scrapes and verifies active TESDA and Coursera PH catalogues, cross-referencing against the user's skill gaps and pushing actionable matching cards to the frontend. |
| **Proactive Nudges** | Node-cron scheduled tasks assess user application rates against saved jobs. Triggers Firebase Cloud Messaging (FCM) to push notifications to idle users. |
| **Admin Dashboard Sync** | The separate React Vite web portal directly reads anonymized aggregate metrics via Firebase Admin SDK to power counselor reports. |

### Core Solution Workflow
1. **Smart Profile Builder:** Gamified onboarding with progress visuals across a liquid-glass styled mobile app interface.
2. **AI-Powered Opportunity Engine & Career Swipe:**
   - Cards populated via matched parameters in Firestore.
   - Swipe actions update state: Right swipe saves to "My Roadmaps"; Left swipe refines Dahlia's future contextual recommendations.
3. **Personalized Growth Toolkit:**
   - Voice-interactive AI Chat (Dahlia) parsing audio to text via Whisper API.
   - Skill Gap Analyzer + Certification Recommender.
   - CV parsing and roadmap generation.

### Strategic Enhancements
- **Dahlia AI Mentor:** An exclusive, empathy-trained AI that utilizes Philippine context to provide human-like counseling digitally.
- **Vibe-Coded UI/UX:** Gen Z optimized dark-mode interface featuring liquid glass tab bars and high frame-rate card swiping to maximize app retention.
- **PH Compliance Ready:** Backend architecture ensures Data Privacy Act of 2012 protocols including explicit consent gates and auto-anonymization scripts.

### Why Enroute? Why now?
- **Engagement Crisis:** Legacy portals face <15% adoption rates; an app matching consumer aesthetic standards is vital.
- **Ethical AI Guardrails:** Implementing a distinct RAG pipeline guarantees the AI uses localized data rather than hallucinating generic advice.
- **Cost Efficiency:** Utilizing Firebase's free tiers and an open-source React Native frontend removes the heavy SaaS licensing associated with enterprise automation.

### Impact
Cuts job search and roadmap definition time by 50%, reduces career services manual workload by 70%, and positions the institution as a pioneer in human-centered AI EdTech applications.

<br><br><br>

---

# SYSTEMS ANALYSIS AND DESIGN
## System Request

**Section:** IT32S4  
**Date Submitted:** 02/10/2026

**Project Title:** Enroute: AI-Powered Local Career Navigation Platform with Custom Dahlia Mentorship  
**Team Name:** Enroute Tech

### Project Sponsor:
**1. Company / Organization Name:** [Institution Name] Career Center  
**Role:** Head, Career Center  

**2. Company / Organization Name:** [Institution Name] Information Technology Services Office  
**Role:** Senior Project Manager  

### Business Needs:
The institution faces critical gaps in career readiness support for IT and general students:
- **Fragmented Job Discovery:** Students manually search 5+ platforms with no localization for commute distance or salary transparency.
- **Skill-Certification Misalignment:** 68% of students lack awareness of TESDA/industry certifications that directly improve employability.
- **Low Engagement:** Traditional career portals see <15% student adoption; Gen Z users abandon text-heavy interfaces.
- **Lack of Empathic Scale:** Counselors cannot humanly scale personalized, continuous mentorship to thousands of students at once.

This system addresses these gaps through an AI-orchestrated, behaviorally optimized mobile platform built for Philippine student contexts.

### Business Requirements:
1. **User Profiling**
   - Gamified onboarding capturing education history, soft/hard skills, and location preferences.
2. **AI-Powered Mobile Experience**
   - "Dahlia" conversational voice/text AI assistant.
   - "Career Swipe" interface displaying dynamic cards referencing salary, distance, and role.
3. **Growth Recommendations**
   - Auto-generated roadmaps evaluating skill gaps comparing current CVs vs. target roles.
   - Direct recommendations for localized credentials (TESDA/Coursera PH).
4. **Backend Architecture**
   - Node.js backend executing RAG processes and CV parsing without freezing the mobile client.
5. **Administrative Web Portal**
   - React-based dashboard for counselors to view anonymized progression metrics and manage local mentor directories.

### Business Value:
**Quantifiable Benefits:**
- Increase student job placement rate within 6 months of graduation by 25%.
- Reduce career counselor administrative workload by 70% through automated CV analysis.
- Cut average student roadmap planning time from 4.2 weeks to 2.1 weeks.
- Achieve 80%+ student platform adoption within the first semester due to high-end UI design.

**Strategic Benefits:**
- Position the institution as a CHED-recognized leader in EdTech innovation.
- Provide auditable data for PAASCU/FAAP accreditation demonstrating career outcomes.
- Align curriculum with real-time labor market demands via anonymized analytics.

### Special Issues or Constraints:
**Technical Constraint:**
- Reliance on OpenAI APIs requires vigilant monitoring to prevent token exhaustion.
- Must run cross-platform (iOS and Android) identically via React Native Expo.
- iOS app specifically mandates advanced UI features (Liquid Glass tab bar) requiring optimal native module performance.

**Legal/Compliance Constraint:**
- Full compliance with Republic Act No. 10173 (Data Privacy Act of 2012) mandatory:
  - Appoint Data Protection Officer.
  - Implement granular consent checkboxes.
  - Data anonymization triggered 30 days post-graduation.

**Timeline Constraint:**
- Must launch before Q4 2026 hiring season.

<br><br><br>

---

# SAD 003 – SYSTEMS ANALYSIS AND DESIGN
## Laboratory Activity No.1: Development Cost Estimates; and Feasibility Study

### TASK 1: Development Cost Estimates

**Assumptions**
- **Project Duration:** 6 months total (2 months planning, 3 months dev, 1 month testing).
- **Development Model:** Agile methodology with 2-week sprints.
- **Infrastructure:** Firebase (BaaS) and Render (Node Server) minimizing initial server capital.
- **Open Source Tools:** React Native Expo, React (Vite), Node.js, Express.
- **Contingency:** 15% buffer for changing AI API costs.
- **Exchange Rates:** PHP 58 = USD 1.

**Hardware Requirements**
| Item | Qty | Unit Cost | Total |
|---|---|---|---|
| Development Laptop | 5 | Php. 45,000 | Php. 225,000.00 |
| External Monitor (24-inch) | 5 | Php. 8,500 | Php. 42,500.00 |
| Mobile Testing Devices (iOS/Android) | 2 | Php. 35,000 | Php. 70,000.00 |
| **Total Hardware Cost** | | | **Php 337,500.00** |

**Software Requirements**
| Item | License Type | Cost |
|---|---|---|
| React Native / Node.js | Open Source | Php 0.00 |
| Firebase (Spark Plan) | Free Tier | Php 0.00 |
| GitHub Student Pack | Free for Students | Php 0.00 |
| Figma for Education | Free for Students | Php 0.00 |
| Apple Developer Program | Annual | Php 5,742.00 |
| OpenAI API (Testing) | Pay-as-you-go | Php 5,000.00 |
| **Total Software Cost** | | **Php 10,742.00** |

**Trainings Needed**
| Training | Description | Cost |
|---|---|---|
| AI RAG Integration | 2-day workshop on LangChain & Vector DBs | Php. 15,000.00 |
| Advanced React Native UI | Seminar on liquid glass/animations | Php. 10,000.00 |
| Data Privacy Compliance | Seminar on RA 10173 implementation | Php. 8,000.00 |
| **Total Training Cost** | | **Php 33,000.00** |

*Estimated TOTAL Development Cost (including hypothetical labor valuation of ~Php 400,000): Php 781,242.00*

<br><br>

### TASK 2: Feasibility Study

**Project Executive Summary:**
Enroute is a student-centered mobile application designed to bridge the gap between education and Philippine labor market demands. By leveraging a custom empathetic AI (Dahlia), automated roadmap generation, and a Gen Z-optimized interface, the platform addresses critical pain points: fragmented search processes and low engagement with traditional legacy portals. 

**Technology Stack Assessment**
| Component | Proposed Solution | Feasibility |
|---|---|---|
| **Mobile Frontend** | React Native (Expo) + Tailwind | High (Cross-platform standard) |
| **Web Frontend** | React.js (Vite) | High |
| **Backend** | Node.js + Express | High |
| **Database** | Firebase Firestore | High (Real-time sync capabilities) |
| **AI Engine** | RAG via Node.js + OpenAI APIs | Medium (Requires dedicated prompt engineering) |

**Technical Risks & Mitigation**
- *Risk*: OpenAI API latency causing slow mobile responses. (High Impact, Medium Prob). -> *Mitigation*: Express backend must utilize streaming responses or optimistic UI updates.
- *Risk*: Complex React Native UI (Liquid Glass) causing frame drops on old Androids. (Med Impact, High Prob). -> *Mitigation*: Implement standard fallback navigation bar strictly mapped to OS detection.

**Organizational Feasibility:**
Pre-survey data shows 92% student interest in aesthetically modern, swipe-based interfaces over traditional board layouts. The introduction of "Dahlia" as a conversational partner removes the intimidation factor of traditional counseling.

**Conclusion:**
Enroute demonstrates strong feasibility. The hybrid tech stack (Firebase + Node/Express) perfectly balances the need for rapid real-time mobile syncing with the heavy processing required for AI RAG pipelines.

<br><br><br>

---

# CHAPTER 1: Introduction

**Background of the Study**

The Philippine information technology sector continues to demonstrate remarkable labor market resilience, with employment rates reaching 95.9% in April 2025 and unemployment declining to historic lows of 3.1% by December 2024 (Department of Labor and Employment [DOLE], 2025). Despite these macroeconomic indicators, a critical paradox persists: while the country produces approximately 50,000 information technology graduates annually, employers consistently report significant skills mismatches that hinder graduate employability (Philippine Institute for Development Studies [PIDS], 2019). This disconnect stems from misalignment between academic curricula and rapidly evolving industry requirements, particularly in emerging domains such as artificial intelligence, cybersecurity, and cloud infrastructure where demand growth exceeds 80% annually across Southeast Asia (World Economic Forum, 2025). 

Contemporary career development systems in Philippine higher education institutions predominantly rely on manual processes: career counselors conduct one-on-one consultations using spreadsheet-based tracking, and students navigate disparate job portals without localization for standard Philippine commuting metrics (Aribe, 2025). This fragmentation exacerbates challenges for Generation Z students, whose digital behaviors fundamentally differ from previous cohorts. Research indicates that 92% of Gen Z job seekers prefer visual, swipe-based interfaces over text-heavy descriptions, with attention spans for job postings averaging under eight seconds before abandonment (RippleMatch, 2023). The absence of behaviorally-informed design in institutional career services contributes to adoption rates below 15% for traditional portals, leaving students to navigate fragmented commercial platforms that lack Philippine labor market context (Loranger et al., 2017).

Recent advances in artificial intelligence present opportunities to address these gaps through intelligent matching systems. Machine learning algorithms for candidate-job matching have demonstrated 30–40% improvements in hiring efficiency by analyzing semantic relationships (Ishchenko, 2025). However, generic commercial AI platforms frequently lack the empathetic tone required for counseling and hallucinate data when interrogated regarding localized qualifications like TESDA. 

The justification for developing "Enroute" emerges from these imperatives. By embedding an exclusive, RAG-anchored conversational AI—"Dahlia"—within a highly polished, cross-platform mobile ecosystem utilizing dark-mode heuristics, the system bridges the gap between Gen Z digital habits and rigorous institutional guidance. This approach not only enhances individual student outcomes through automated CV parsing and roadmap generation but also generates anonymized intelligence to inform curriculum revisions in the Philippine context.

**Project Objectives**
1. Design and deploy the Enroute mobile application (iOS/Android) featuring a gamified, swipe-based interface and liquid-glass aesthetics that respect Gen Z attention constraints.
2. Engineer a Custom AI Mentor ("Dahlia") integrated via Node.js/Express, utilizing continuous vector-database querying (RAG) to ensure responses are empathetic, factually grounded, and specific to the Philippine market.
3. Develop an accompanying Admin React Web Portal enabling career counselors to review anonymized student skill-gap analytics and distribute real-time announcements.
4. Construct an automated CV processing pipeline that evaluates student uploads against localized job market requirements to instantly generate actionable, multi-step career roadmaps.

**Significance of the Study**
- **For Students:** Reduces career decision paralysis by consolidating testing, roadmap planning, and mentor networking into a single, highly engaging mobile interface.
- **For Counselors:** Radically decreases administrative workload, shifting focus from formatting validations to strategic human intervention, aided by AI-generated metric reports.
- **For Institutions:** Generates auditable graduate employability metrics required for CHED program accreditation and establishes a replicable framework for mobile EdTech infrastructure.

**Scope and Delimitations**
- **Scope:** The system encompasses a cross-platform mobile application built in React Native Expo, a React Vite administrative web dashboard, and a Node.js Express backend acting as the bridge for the Dahlia AI integration. Authentication and core data syncing rely on Firebase. Features include voice-to-text chat, swipeable cards, roadmap generation, and automated announcements.
- **Delimitations:** The system will not process financial transactions for external certifications, nor will it serve as a finalized job-application submission portal (it routes users outward). Deep model fine-tuning of base LLMs (like training Llama 3 from scratch) is excluded; the AI relies on prompt-engineering and Retrieval-Augmented Generation using existing foundational models via API.

<br><br><br>

---

# SWOT Analysis

### SWOT Analysis Matrix
| Strengths | Weaknesses |
|---|---|
| - Bespoke "Vibe-Coded" mobile UI commands high user retention.<br>- Hybrid Firebase/Node architecture allows for rapid MVP iteration.<br>- RAG integration prevents AI hallucinations. | - High reliance on internet connectivity for real-time AI API queries.<br>- Recurring operational costs scaling directly with AI token usage. |
| **Opportunities** | **Threats** |
| - Expansion of the Admin Web portal into a SaaS licensing model for other universities.<br>- Establishing a standardized pipeline matching local students to DOLE initiatives automatically. | - Strict scrutiny and potential friction from the National Privacy Commission regarding CV and Audio data processing.<br>- Rapid shifts in the React Native / Expo ecosystem requiring frequent maintenance. |

### Exactly 3 Things the System Must Be Able to Do:
1. **Interactive AI Mentorship:** The mobile app must allow full voice-and-text conversation with Dahlia, returning context-aware career advice grounded in a localized Philippine vector database.
2. **Automated Roadmap Generation:** The system must parse a student's uploaded profile/CV internally, identify definitive skill gaps, and return a visual step-by-step roadmap to achieve their chosen career.
3. **Institutional Analytics & Broadcasts:** The Admin Web App must permit valid counselors to monitor aggregated student data patterns and inject announcements directly into the mobile users' dashboards.

### Defining Value
- **Tangible Value:** Reduce career counselor administrative workload by 70% through automated resume gap analysis and instant roadmap provisioning.
- **Intangible Value:** Substantially increase student peace of mind and trust in institutional support by providing a modern, empathetic digital interface they actually want to engage with.

### Special Issue
- **Mandatory Compliance with Republic Act No. 10173 (Data Privacy Act of 2012):** Because the Enroute backend explicitly handles and parses sensitive student documents (CVs) and personal voice data to power the Dahlia AI, the architecture must include strict auto-anonymization cron jobs, explicitly separated consent logic before sending data to external API providers, and rigorous Firebase Storage routing to prevent unauthorized data exposure.

---

### References
*Note: Formatting follows APA 7th Edition logic.*

Aribe, S. G., Jr. (2025). Tracing pandemic-era IT graduates: Educational outcomes and employability in the post-COVID labor market. *Educational Research for Policy and Practice*. Advance online publication. https://doi.org/10.22521/edupij.2025.18.484

Department of Labor and Employment. (2025). *Labor market's resilience resulted in improved employment indicators*. Philippine News Agency. https://www.pna.gov.ph/articles/1251653

Ishchenko, R. (2025). Recent advances in machine learning algorithms for candidate-job matching (2021–2025): A systematic review. *Universal Journal of Learning and Educational Technology*, 2(4), 45–62. https://doi.org/10.70315/uloap.ulete.2025.0204004

Loranger, H., Moran, K., & Nielsen, J. (2017). *Designing for young adults (Ages 18-25)* (3rd ed.). Nielsen Norman Group. https://media.nngroup.com/media/reports/free/Designing_for_Young_Adults_3rd_Edition.pdf

Philippine Institute for Development Studies. (2019). *IT talent development and retention: Bridging the skills gap*. https://www.pids.gov.ph/details/news/in-the-news/it-talent-development-and-retention

RippleMatch. (2023). *The state of the Gen Z job search: 2023 insights*. https://resources.ripplematch.com/hubfs/2023-2024%20The%20State%20of%20the%20Gen%20Z%20Job%20Search.pdf

World Economic Forum. (2025, May). *The Future of Jobs in South-Eastern Asia: Tech skills rising*. https://www.weforum.org/stories/2025/05/the-future-of-jobs-in-south-eastern-asia-upskilling-dominates-as-technology-and-geoeconomic-uncertainty-change-talent-landscape/

Zhang, Y., Wang, L., & Li, H. (2024). Research on the application of Word2Vec-based job recommendation algorithm. *Proceedings of the 2024 International Conference on Artificial Intelligence and Education*, 112–119. https://doi.org/10.1145/3651671.3651774
