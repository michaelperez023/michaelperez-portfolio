// Single source of truth for site content.
// Plain data, imported directly, no fake HTTP layer.

export const information = {
  name: "Michael Pérez",
  fullName: "Michael Francis Pérez",
  role: "ML & Computer Vision Researcher",
  tagline:
    "PhD candidate at the University of Florida specializing in video understanding, computer vision, and real-time ML systems. I build end-to-end pipelines for video analysis, detection, and retrieval.",
  location: "Gainesville, Florida",
  email: "michaelperez012@ufl.edu",
  headshot: "/images/headshot.jpg",
  cvFile: "/files/CV.pdf",
  social: {
    github: "https://github.com/michaelperez023",
    linkedin: "https://www.linkedin.com/in/michaelperez023/",
    scholar: "https://scholar.google.com/citations?user=fCzyXhUAAAAJ&hl=en",
  },
};

export const about = {
  paragraphs: [
    "I'm a PhD candidate in Computer Science at the University of Florida specializing in video understanding, computer vision, and real-time ML systems. I design and deploy end-to-end pipelines for video analysis, including detection, segmentation, and retrieval, across both real-time and offline settings.",
    "My research spans two DARPA-funded programs at the Ruiz HCI Lab: CReLeRI, an explainable long-video analysis system published at ACM Multimedia 2025, and ENKIx, a real-time AR task-guidance system. I also build scalable systems for processing and indexing large-scale video data.",
  ],
  facts: [
    { label: "Focus", value: "Video understanding · Computer vision · Real-time ML" },
    { label: "PhD expected", value: "August 2026 · University of Florida" },
    { label: "Open to", value: "Full-time ML / AI Engineer roles" },
  ],
};

// Featured research. Venue and role surfaced up front.
export const publications = [
  {
    id: 1,
    year: "2025",
    venue: "ACM Multimedia",
    title:
      "CReLeRI: Explainable, Concept-centric Representation, Learning, Reasoning, and Interaction Video Analysis System",
    authors:
      "Michael Pérez, Yichi Yang, Yuheng Zha, Enze Ma, Danish Tamboli, Haodi Ma, Reza Shahriari, Vyom Pathak, Dzmitry Kasinets, Rohith Venkatakrishnan, Daisy (Zhe) Wang, Jaime Ruiz, Eric D. Ragan, Zhiting Hu, Eric Xing, Jun-Yan Zhu",
    note: "Proceedings of the 33rd ACM International Conference on Multimedia",
    link: "https://dl.acm.org/doi/10.1145/3746027.3754479",
    lead: true,
  },
  {
    id: 9,
    year: "2026",
    venue: "Int. Conference on Human-Agent Interaction (HAI)",
    title:
      "The Effects of Multiple Companion Agents on User Experience and Mental Workload",
    authors:
      "Rodrigo Calvo, Christopher Bowers, Michael Pérez, Alexander Barquero, Jaime Ruiz",
    note: "Proceedings of the 14th Int. Conference on Human-Agent Interaction · Accepted, to appear",
    link: null,
  },
  {
    id: 8,
    year: "2026",
    venue: "Military Sensing Symposium",
    title:
      "Super-Resolution for Improving Vehicle Recognition at Large Standoffs",
    authors: "Michael Pérez et al. (with CoVar)",
    note: "MSS (BSD, Materials & Detectors, and Passive Sensors) Conference",
    link: null,
  },
  {
    id: 2,
    year: "2025",
    venue: "IEEE Computer Graphics & Applications",
    title:
      "MuCHEx: A Multimodal Conversational Debugging Tool for Interactive Visual Exploration of Hierarchical Object Classification",
    authors:
      "Reza Shahriari, Yichi Yang, Danish Nisar Ahmed Tamboli, Michael Pérez, Yuheng Zha, Jinyu Hou, Mingkai Deng, Eric D. Ragan, Jaime Ruiz, Daisy Zhe Wang, Zhiting Hu, Eric Xing",
    note: "IEEE Computer Graphics and Applications, 1–13",
    link: "https://doi.org/10.1109/MCG.2025.3598204",
  },
  {
    id: 3,
    year: "2021",
    venue: "Int. J. Computer Assisted Radiology & Surgery",
    title:
      "Evaluating the Agreement and Reliability of a Web-Based Facial Analysis Tool for Rhinoplasty",
    authors:
      "Oguzhan Topsakal, Mustafa Ilhan Akbas, Bria Smith, Michael Pérez, Ege Can Guden, Mazhar Mehmet Celikoyar",
    note: "IJCARS 16, 1381–1391",
    link: "https://link.springer.com/article/10.1007/s11548-021-02423-z",
  },
  {
    id: 4,
    year: "2021",
    venue: "Aesthetic Surgery Journal",
    title:
      "Facial Surface Anthropometric Features and Measurements With an Emphasis on Rhinoplasty",
    authors:
      "Mazhar Celikoyar, Michael Pérez, Mustafa Ilhan Akbaş, Oguzhan Topsakal",
    note: "Aesthetic Surgery Journal",
    link: "https://doi.org/10.1093/asj/sjab190",
  },
  {
    id: 6,
    year: "2020",
    venue: "Int. J. Computer Assisted Radiology & Surgery",
    title:
      "Digitizing Rhinoplasty: a web application with three-dimensional preoperative evaluation to assist rhinoplasty surgeons with surgical planning",
    authors:
      "Oguzhan Topsakal, Mustafa Ilhan Akbaş, Doga Demirel, Rafael Nunez, Bria Smith, Michael Pérez, Mazhar Celikoyar",
    note: "IJCARS 15(11):1941–1950",
    link: "https://pubmed.ncbi.nlm.nih.gov/32888163/",
  },
];

// Active manuscripts being revised for submission.
export const workingPapers = [
  {
    id: 1,
    year: "2026",
    title:
      "ENKIx: An Intelligent AR Task Guidance System with Cognitive Load-Adaptive Capabilities",
    note: "Manuscript in preparation",
    link: null,
  },
  {
    id: 2,
    year: "2026",
    title:
      "Temporal Granularity as a Design Variable in Zero-Shot Video Retrieval",
    note: "Manuscript in preparation",
    link: null,
  },
];

// Preprints and class projects, secondary, with downloadable reports.
export const preprints = [
  {
    id: 0,
    year: "2023",
    title:
      "CNN-Based Action Recognition and Pose Estimation for Classifying Animal Behavior from Videos: A Survey",
    note: "arXiv preprint · with Corey Toler-Franklin",
    link: "https://arxiv.org/abs/2301.06187",
  },
  {
    id: 1,
    year: "2023",
    title: "Abstractive Urdu Summarization for News Article Dataset",
    note: "Natural Language Processing",
    file: "/files/Urdu_Summarization_Report.pdf",
    githubLink: "https://github.com/michaelperez023/urdu-abstractive-summarization",
  },
  {
    id: 2,
    year: "2022",
    title: "An Investigation of ADAM: A Stochastic Optimization Method",
    note: "Advanced Machine Learning",
    file: "/files/ADAM_Investigation_Report.pdf",
    githubLink: "https://github.com/michaelperez023/ADAM",
  },
  {
    id: 3,
    year: "2022",
    title: "Investigation of VideoGAN for Video Generation and Recognition",
    note: "Machine Learning",
    file: "/files/VideoGAN_Investigation_Report.pdf",
    githubLink: "https://github.com/michaelperez023/VideoGAN",
  },
  {
    id: 5,
    year: "2020",
    title: "Survey of the k-Means Clustering Problem",
    note: "Analysis of Algorithms",
    file: "/files/k-means_Survey.pdf",
  },
];

export const workingExperience = [
  {
    id: 1,
    year: "May – Aug 2025",
    position: "Machine Learning Engineer Intern",
    company: "CoVar",
    location: "Durham, NC",
    details:
      "Applied infrared video super-resolution models to improve long-range object classification, published with CoVar collaborators at the Military Sensing Symposium 2026. Trained lightweight RGB object-detection models for real-time drone detection under resource-constrained deployment, and built offline computer-vision evaluation pipelines spanning preprocessing, inference, and metric analysis.",
  },
  {
    id: 2,
    year: "2023 – Present",
    position: "Graduate Research Assistant",
    company: "Ruiz HCI Lab, CISE Department, University of Florida",
    location: "Gainesville, FL",
    details:
      "Develop and evaluate ML models for video understanding, including action recognition, segmentation, and retrieval, and build scalable pipelines for video processing, training, and inference. Across two DARPA-funded programs: CReLeRI, an explainable long-video analysis system (ACM Multimedia 2025), and ENKIx, a real-time AR task-guidance system that reached 34% F1 in a multi-team DARPA evaluation. Designed computer-vision systems for AR, web, and neuroscience applications.",
  },
  {
    id: 3,
    year: "2020 – Present",
    position: "Graduate Teaching Assistant",
    company: "CISE Department, University of Florida",
    location: "Gainesville, FL",
    details:
      "TA across algorithms, systems, and ML courses, including Analysis of Algorithms, Data Structures and Algorithms, Operating Systems, Performant Programming in Python, Deep Learning for Computer Graphics, and Computational Structures for Computer Graphics. Developed automated grading tools and supported 100+ students.",
  },
  {
    id: 4,
    year: "2020 – 2023",
    position: "Graduate Research Assistant",
    company: "Graphics, Imaging & Light Measurement Lab, University of Florida",
    location: "Gainesville, FL",
    details:
      "Developed and evaluated video-based action-recognition models for animal-behavior analysis (NSF-funded), exploring semi-supervised and adversarial approaches to model motion and behavior, with Dr. Corey Toler-Franklin and Dr. Darragh Devine (UF Psychology).",
  },
  {
    id: 5,
    year: "2019 – 2020",
    position: "Research Assistant",
    company: "Rhinoplasty Research Group, Florida Polytechnic University",
    location: "Lakeland, FL",
    details:
      "Surveyed 50+ papers documenting facial landmarks and measurements relevant to rhinoplasty, and helped build a web interface for importing, exporting, and displaying feature-point coordinates on 3D facial models.",
  },
];

export const education = [
  {
    id: 1,
    year: "2020 – 2026 (expected)",
    degree: "Ph.D. in Computer Science",
    school: "University of Florida",
  },
  {
    id: 2,
    year: "2020 – 2023",
    degree: "M.S. in Computer Science",
    school: "University of Florida",
  },
  {
    id: 3,
    year: "2018 – 2020",
    degree: "B.S. in Computer Science",
    school: "Florida Polytechnic University",
  },
];

export const coursework = [
  "Machine Learning",
  "Advanced Machine Learning",
  "Natural Language Processing",
  "Analysis of Algorithms",
  "Advanced Data Structures",
  "Distributed Operating Systems",
  "Math for Intelligent Systems",
  "Computer Graphics",
  "Advanced Computer Graphics",
  "Computer Networks",
  "3D Audio",
];

export const skillGroups = [
  {
    title: "Machine Learning & CV",
    items: ["PyTorch", "TensorFlow", "OpenCV", "scikit-learn"],
  },
  {
    title: "LLMs & Agents",
    items: ["LangChain", "Hugging Face", "Transformers"],
  },
  {
    title: "Systems & Deployment",
    items: ["Docker", "FastAPI", "Flask", "Pydantic", "Linux", "Bash", "ROS", "SLURM", "HPC", "Git"],
  },
  {
    title: "Data Science",
    items: ["NumPy", "pandas", "SciPy", "MATLAB", "Jupyter"],
  },
  {
    title: "Graphics & 3D Audio",
    items: ["OpenGL", "WebGL", "OpenAL", "Blender"],
  },
  {
    title: "Web & Mobile",
    items: ["React", "JavaScript", "HTML", "CSS", "Flutter", "Dart", "WordPress"],
  },
  {
    title: "Scientific Writing",
    items: ["LaTeX", "Illustrator", "Photoshop", "Premiere", "SigmaPlot"],
  },
  {
    title: "Languages & Tooling",
    items: ["Python", "C++", "SQL", "C", "C#", "Java", "F#", "Julia", "Akka.NET", "CMake"],
  },
];

export const honors = [
  {
    id: 1,
    year: "2022",
    title: "L3Harris Corporation Graduate Fellowship",
    note: "Awarded to five UF CISE graduate students for academic performance, research activity, and service.",
  },
  {
    id: 2,
    year: "2020 – Present",
    title: "Graduate School Preeminence Award",
    note: "Competitive research-assistantship stipend offered to UF CISE's strongest PhD applicants.",
  },
  {
    id: 3,
    year: "2021 – Present",
    title: "GenerationNext Grant",
    note: "Cohort-based support program for PhD students in the UF CISE department.",
  },
];

export const service = [
  { id: 1, year: "2026", role: "Peer Reviewer", venue: "ACM ICMR 2026" },
  { id: 2, year: "2025", role: "Peer Reviewer", venue: "ACM Multimedia 2025" },
  {
    id: 3,
    year: "2025",
    role: "Co-Chair",
    venue: "UF Human-Centered Data Science Seminar",
  },
  {
    id: 4,
    year: "2024",
    role: "Peer Reviewer",
    venue: "IEEE Conference on Virtual Reality and 3D User Interfaces",
  },
  {
    id: 5,
    year: "2023",
    role: "Panelist",
    venue: "Black Male Computer Scientist Panel · Reichert House Youth Academy",
  },
];

export const projects = [
  {
    id: 1,
    title: "Video Analysis Website",
    subtitle:
      "Long-video analysis tool with an HTML/JS/CSS front end and FastAPI backend.",
    image: "/images/creleri_screenshot.png",
    url: "https://youtu.be/XDCue9EYNTU",
    githubLink: "https://github.com/michaelperez023/creleri-video",
    tags: ["FastAPI", "Web", "Video"],
  },
  {
    id: 11,
    title: "Gossip & Push-Sum Simulator",
    subtitle:
      "Distributed-systems simulator modeling gossip and push-sum convergence across full, line, 3D, and imperfect-3D topologies, scaling past 2M nodes.",
    image: "/images/gossip-simulator.svg",
    url: null,
    githubLink: "https://github.com/michaelperez023/gossip-simulator",
    tags: ["F#", "Distributed Systems"],
  },
  {
    id: 2,
    title: "Mario Graphics Game",
    subtitle: "2.5D Mario-style game built with WebGL, HTML, and JavaScript.",
    image: "/images/mario-game-square.jpg",
    url: "https://www.youtube.com/watch?v=5lfsQRtfBVY",
    githubLink: "https://github.com/michaelperez023/escape-the-maze",
    tags: ["WebGL", "Graphics"],
  },
  {
    id: 3,
    title: "From Here to There: 3D Audio Experience",
    subtitle:
      "2D-visual, 3D-audio children's experience built with OpenGL, OpenAL, and GLFW in Java.",
    image: "/images/audio-game-square.jpg",
    url: "https://www.youtube.com/watch?v=ztOUkMKE2qs",
    report: "/files/Visual_3D_Audio_Project_Report.pdf",
    tags: ["OpenGL", "OpenAL", "Java"],
  },
  {
    id: 4,
    title: "Twitter Clone",
    subtitle:
      "Twitter clone using the Akka.NET actor model and Suave web framework in F#.",
    image: "/images/twitter-clone-square.jpg",
    url: "https://youtube.com/watch?v=-I0TTJJyyog",
    githubLink: "https://github.com/michaelperez023/twitter-clone-part2",
    tags: ["F#", "Akka.NET"],
  },
  {
    id: 5,
    title: "Advanced Graphics Scene",
    subtitle: "Graphics scene built with OpenGL's tessellation engine.",
    image: "/images/graphics-p2-square.jpg",
    url: "https://www.youtube.com/watch?v=p0I2bMXk2z8",
    tags: ["OpenGL", "Tessellation"],
  },
  {
    id: 6,
    title: "Hermes Tracker App",
    subtitle:
      "Flutter app for tracking mail and packages at Florida Poly's mail center.",
    image: "/images/hermes-app-square.jpg",
    url: null,
    githubLink: "https://github.com/michaelperez023/hermes-tracker",
    tags: ["Flutter", "Mobile"],
  },
  {
    id: 7,
    title: "Game Advertisement Video",
    subtitle:
      "Short Adobe Premiere video advertising a fictitious video game.",
    image: "/images/game-ad-square.jpg",
    url: "https://youtu.be/jsV24C-IH18",
    tags: ["Premiere", "Video"],
  },
  {
    id: 8,
    title: "DR Villas Booking Website",
    subtitle: "Dominican Republic villa-booking site built with WordPress.",
    image: "/images/dominican-go-square.jpg",
    url: "https://govacationvillas.com",
    tags: ["WordPress", "Web"],
  },
  {
    id: 9,
    title: "Surgery Tool Simulator",
    subtitle: "Surgery-simulation graphics scene developed with OpenGL.",
    image: "/images/simulator-square.jpg",
    url: "https://youtu.be/r48TvIaX5rI",
    tags: ["OpenGL", "Simulation"],
  },
  {
    id: 10,
    title: "This Portfolio",
    subtitle: "Built with React and Vite.",
    image: "/images/portfolio-website-square.jpg",
    url: null,
    githubLink: "https://github.com/michaelperez023/michaelperez-portfolio",
    tags: ["React", "Vite"],
  },
];
