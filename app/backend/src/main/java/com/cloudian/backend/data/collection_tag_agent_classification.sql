-- Catalogue seed for AI classification suggestions.
-- No agent_classification rows are inserted because they require an existing document_submission.
BEGIN;

INSERT INTO public.collection (
    id, name, description, slug, keywords, created_at, updated_at
)
VALUES
    ('00000000-0000-0000-0000-000000009101', 'Toán học / Mathematics', 'Tài liệu Toán học từ cơ bản đến nâng cao, gồm đại số, hình học và giải tích.', 'mathematics', ARRAY['math', 'toán', 'algebra', 'geometry', 'calculus', 'equation', 'formula']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009102', 'Khoa học tự nhiên', 'Tài liệu Vật lý, Hóa học, Sinh học, thí nghiệm và nghiên cứu khoa học tự nhiên.', 'natural-sciences', ARRAY['physics', 'chemistry', 'biology', 'science', 'thí nghiệm', 'laboratory']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009103', 'Ngôn ngữ và Văn học', 'Tài liệu Ngữ văn, tiếng Anh, kỹ năng đọc hiểu, viết và giao tiếp ngôn ngữ.', 'languages-literature', ARRAY['literature', 'ngữ văn', 'English', 'grammar', 'essay', 'reading', 'writing']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009104', 'Khoa học xã hội', 'Tài liệu Lịch sử, Địa lý, Giáo dục công dân và các chủ đề xã hội.', 'social-sciences', ARRAY['history', 'geography', 'civics', 'xã hội', 'bản đồ', 'công dân']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009105', 'Tin học và Công nghệ', 'Tài liệu Tin học, lập trình, công nghệ số, thuật toán và dự án phần mềm.', 'computing-technology', ARRAY['computer science', 'programming', 'coding', 'algorithm', 'Python', 'technology']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009106', 'Quản trị và Đánh giá nhà trường', 'Kế hoạch bài dạy, kiểm tra đánh giá, tài liệu học sinh và văn bản quản trị trường học.', 'school-operations', ARRAY['lesson plan', 'assessment', 'exam', 'rubric', 'student project', 'school policy', 'quy định']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009107', 'AI và Hệ thống thông minh', 'Tài liệu về AI, LLM, agent, prompt engineering, RAG và ứng dụng trí tuệ nhân tạo.', 'ai-intelligent-systems', ARRAY['artificial intelligence', 'LLM', 'agent', 'prompt', 'RAG', 'machine learning', 'generative AI']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009108', 'Dữ liệu và Phân tích', 'Tài liệu về dữ liệu, phân tích, business intelligence, database và data engineering.', 'data-analytics', ARRAY['data analytics', 'business intelligence', 'dashboard', 'database', 'SQL', 'ETL', 'data pipeline']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009109', 'Kỹ thuật Phần mềm và Cloud', 'Tài liệu phát triển phần mềm, kiến trúc hệ thống, API, DevOps, cloud và bảo mật.', 'software-engineering-cloud', ARRAY['software architecture', 'API', 'DevOps', 'cloud', 'cybersecurity', 'programming', 'deployment']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009110', 'Sản phẩm và Dự án', 'Tài liệu quản lý sản phẩm, quản lý dự án, UX, roadmap và phối hợp thực thi.', 'product-project-management', ARRAY['product management', 'project management', 'roadmap', 'UX', 'agile', 'milestone', 'requirements']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009111', 'Kinh doanh và Tăng trưởng', 'Tài liệu chiến lược kinh doanh, startup, marketing, sales, customer success và thương mại điện tử.', 'business-growth', ARRAY['business strategy', 'startup', 'marketing', 'sales', 'customer success', 'e-commerce', 'growth']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009112', 'Vận hành và Nhân sự', 'Tài liệu quy trình vận hành, nhân sự, chuỗi cung ứng, procurement và chất lượng nội bộ.', 'operations-people', ARRAY['operations', 'human resources', 'supply chain', 'procurement', 'SOP', 'employee', 'logistics']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009113', 'Tài chính, Pháp lý và Quản trị', 'Tài liệu tài chính, kế toán, đầu tư, pháp lý, compliance, governance và ESG.', 'finance-governance', ARRAY['finance', 'accounting', 'investment', 'legal', 'compliance', 'governance', 'sustainability']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07'),
    ('00000000-0000-0000-0000-000000009114', 'Ngành nghề và Dịch vụ', 'Tài liệu chuyên ngành như y tế, giáo dục, dịch vụ công và các lĩnh vực vận hành đặc thù.', 'industry-services', ARRAY['healthcare', 'education', 'industry', 'service', 'policy', 'patient care', 'public sector']::text[], '2026-11-20 00:00:00+07', '2026-11-20 00:00:00+07')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    keywords = EXCLUDED.keywords,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.tag (id, name, slug, description)
VALUES
    ('00000000-0000-0000-0000-000000009001', 'Mathematics', 'mathematics', 'General mathematics materials, formula sheets, exercises, and learning resources.'),
    ('00000000-0000-0000-0000-000000009002', 'Algebra', 'algebra', 'Equations, functions, polynomials, inequalities, and algebraic problem solving.'),
    ('00000000-0000-0000-0000-000000009003', 'Geometry', 'geometry', 'Plane and spatial geometry, vectors, proofs, and geometric diagrams.'),
    ('00000000-0000-0000-0000-000000009004', 'Calculus', 'calculus', 'Limits, derivatives, integrals, probability, and advanced high-school mathematics.'),
    ('00000000-0000-0000-0000-000000009005', 'Physics', 'physics', 'Mechanics, electricity, waves, optics, thermodynamics, and physics experiments.'),
    ('00000000-0000-0000-0000-000000009006', 'Chemistry', 'chemistry', 'Chemical reactions, elements, molecules, laboratory work, and chemical equations.'),
    ('00000000-0000-0000-0000-000000009007', 'Biology', 'biology', 'Cells, genetics, ecology, human biology, organisms, and life-science experiments.'),
    ('00000000-0000-0000-0000-000000009008', 'Computer Science', 'computer-science', 'Algorithms, data structures, computational thinking, and informatics coursework.'),
    ('00000000-0000-0000-0000-000000009009', 'Programming', 'programming', 'Source code, software projects, Python, web development, and programming exercises.'),
    ('00000000-0000-0000-0000-000000009010', 'Literature', 'literature', 'Vietnamese literature, literary works, reading comprehension, and essay analysis.'),
    ('00000000-0000-0000-0000-000000009011', 'English Language', 'english-language', 'English grammar, vocabulary, reading, writing, listening, and speaking practice.'),
    ('00000000-0000-0000-0000-000000009012', 'History', 'history', 'Vietnamese history, world history, historical events, timelines, and source analysis.'),
    ('00000000-0000-0000-0000-000000009013', 'Geography', 'geography', 'Maps, climate, population, regions, natural resources, and geographic data.'),
    ('00000000-0000-0000-0000-000000009014', 'Civics', 'civics', 'Citizenship, ethics, law, social responsibility, and civic education.'),
    ('00000000-0000-0000-0000-000000009015', 'Lesson Plan', 'lesson-plan', 'Teaching plans, learning objectives, classroom activities, and teaching schedules.'),
    ('00000000-0000-0000-0000-000000009016', 'Assessment', 'assessment', 'Exams, quizzes, answer keys, grading rubrics, and student evaluation.'),
    ('00000000-0000-0000-0000-000000009017', 'Student Project', 'student-project', 'Student research, group assignments, presentations, and project reports.'),
    ('00000000-0000-0000-0000-000000009018', 'School Policy', 'school-policy', 'School regulations, notices, administrative guidance, and official procedures.'),
    ('00000000-0000-0000-0000-000000009019', 'Artificial Intelligence', 'artificial-intelligence', 'Artificial intelligence concepts, machine learning, model evaluation, and AI applications.'),
    ('00000000-0000-0000-0000-000000009020', 'Large Language Model', 'large-language-model', 'LLM models, generative AI, language-model capabilities, limitations, and model selection.'),
    ('00000000-0000-0000-0000-000000009021', 'AI Agent', 'ai-agent', 'Autonomous agents, tool calling, agent workflows, multi-agent systems, and agent orchestration.'),
    ('00000000-0000-0000-0000-000000009022', 'Prompt Engineering', 'prompt-engineering', 'Prompt design, system instructions, few-shot examples, structured output, and prompt evaluation.'),
    ('00000000-0000-0000-0000-000000009023', 'Retrieval Augmented Generation', 'retrieval-augmented-generation', 'RAG pipelines, embeddings, vector search, retrieval quality, and grounded LLM answers.'),
    ('00000000-0000-0000-0000-000000009024', 'Data Analytics', 'data-analytics', 'Data analysis, dashboards, metrics, business intelligence, reporting, and data visualization.'),
    ('00000000-0000-0000-0000-000000009025', 'Data Engineering', 'data-engineering', 'Data pipelines, ETL, data warehouses, databases, data quality, and data infrastructure.'),
    ('00000000-0000-0000-0000-000000009026', 'Cybersecurity', 'cybersecurity', 'Information security, access control, vulnerabilities, incident response, and security policy.'),
    ('00000000-0000-0000-0000-000000009027', 'Cloud Computing', 'cloud-computing', 'Cloud architecture, hosting, infrastructure, containers, deployment, and cloud services.'),
    ('00000000-0000-0000-0000-000000009028', 'Software Architecture', 'software-architecture', 'System design, APIs, application architecture, scalability, and engineering decisions.'),
    ('00000000-0000-0000-0000-000000009029', 'Product Management', 'product-management', 'Product strategy, user requirements, roadmaps, prioritization, discovery, and product metrics.'),
    ('00000000-0000-0000-0000-000000009030', 'Project Management', 'project-management', 'Project plans, milestones, delivery tracking, risk management, agile methods, and stakeholder coordination.'),
    ('00000000-0000-0000-0000-000000009031', 'Business Strategy', 'business-strategy', 'Business models, market analysis, competitive strategy, growth planning, and strategic decisions.'),
    ('00000000-0000-0000-0000-000000009032', 'Marketing', 'marketing', 'Marketing campaigns, branding, customer segments, content marketing, and market research.'),
    ('00000000-0000-0000-0000-000000009033', 'Sales', 'sales', 'Sales process, leads, customer relationship management, proposals, and revenue pipeline.'),
    ('00000000-0000-0000-0000-000000009034', 'Human Resources', 'human-resources', 'Recruitment, employee development, performance review, workplace policy, and people operations.'),
    ('00000000-0000-0000-0000-000000009035', 'Finance and Accounting', 'finance-accounting', 'Financial statements, budgeting, cash flow, accounting, tax, and expense management.'),
    ('00000000-0000-0000-0000-000000009036', 'Legal and Compliance', 'legal-compliance', 'Contracts, regulations, compliance requirements, legal review, privacy, and governance.'),
    ('00000000-0000-0000-0000-000000009037', 'Business Operations', 'business-operations', 'Operational processes, standard operating procedures, procurement, quality control, and internal operations.'),
    ('00000000-0000-0000-0000-000000009038', 'API Integration', 'api-integration', 'APIs, webhooks, authentication, third-party integrations, and service-to-service communication.'),
    ('00000000-0000-0000-0000-000000009039', 'Database', 'database', 'Database design, SQL, data modeling, queries, migrations, and database administration.'),
    ('00000000-0000-0000-0000-000000009040', 'DevOps', 'devops', 'CI/CD, infrastructure automation, monitoring, release management, and operational reliability.'),
    ('00000000-0000-0000-0000-000000009041', 'User Experience', 'user-experience', 'UX research, user interface design, accessibility, usability testing, and customer journeys.'),
    ('00000000-0000-0000-0000-000000009042', 'Customer Success', 'customer-success', 'Customer onboarding, support, retention, feedback, and account health.'),
    ('00000000-0000-0000-0000-000000009043', 'E-commerce', 'ecommerce', 'Online stores, payments, product catalogues, checkout, orders, and digital commerce.'),
    ('00000000-0000-0000-0000-000000009044', 'Startup', 'startup', 'Startup formation, fundraising, innovation, go-to-market planning, and early-stage growth.'),
    ('00000000-0000-0000-0000-000000009045', 'Investment', 'investment', 'Investment analysis, valuation, portfolio strategy, venture capital, and financial markets.'),
    ('00000000-0000-0000-0000-000000009046', 'Supply Chain', 'supply-chain', 'Logistics, inventory, suppliers, procurement, fulfillment, and supply chain planning.'),
    ('00000000-0000-0000-0000-000000009047', 'Healthcare', 'healthcare', 'Healthcare services, clinical operations, health policy, medical administration, and patient care.'),
    ('00000000-0000-0000-0000-000000009048', 'Sustainability', 'sustainability', 'Environmental impact, ESG, sustainable development, climate strategy, and responsible business.')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

COMMIT;
