// Single source of truth for site content.
// Plain data — imported directly, no fake HTTP layer.

export const information = {
  name: "Michael Pérez",
  fullName: "Michael Francis Pérez",
  role: "ML / HCI Researcher",
  tagline:
    "PhD candidate at the University of Florida studying deep learning and its applications across human–computer interaction, computer vision, and graphics.",
  location: "Gainesville, Florida",
  // Left blank intentionally — your original data omitted it. Set a string to surface a contact link.
  email: "",
  headshot: "/images/headshot.jpg",
  cvFile: "/files/CV.pdf",
  social: {
    github: "https://github.com/michaelperez023",
    linkedin: "https://www.linkedin.com/in/michael-perez-8b555a43/",
    scholar: "https://scholar.google.com/citations?user=fCzyXhUAAAAJ&hl=en",
  },
};

export const about = {
  paragraphs: [
    "I research at the Ruiz Human–Computer Interaction Lab and the Data Science Research Lab at the University of Florida, where I work on two DARPA-funded projects spanning action recognition, AR task guidance, and multimodal video analysis.",
    "My background bridges machine learning, computer vision, and computer graphics — from training action-segmentation models to building the interfaces that let people make sense of them.",
  ],
  facts: [
    { label: "Focus", value: "Deep learning · HCI · Computer vision" },
    { label: "Affiliation", value: "University of Florida" },
    { label: "Languages", value: "English, Spanish" },
  ],
};

// Featured research — the differentiator. Venue + role surfaced up front.
export const publications = [
  {
    id: 1,
    year: "2025",
    venue: "ACM Multimedia",
    title:
      "CReLeRI: Explainable, Concept-centric Representation, Learning, Reasoning, and Interaction Video Analysis System",
    authors:
      "Michael Francis Perez, Yichi Yang, Yuheng Zha, Enze Ma, Danish Tamboli, Haodi Ma, Reza Shahriari, Vyom Pathak, Dzmitry Kasinets, Rohith Venkatakrishnan, Daisy (Zhe) Wang, Jaime Ruiz, Eric D. Ragan, Zhiting Hu, Eric Xing, Jun-Yan Zhu",
    note: "Proceedings of the 33rd ACM International Conference on Multimedia",
    link: "https://dl.acm.org/doi/10.1145/3746027.3754479",
    lead: true,
  },
  {
    id: 2,
    year: "2025",
    venue: "IEEE Computer Graphics & Applications",
    title:
      "MuCHEx: A Multimodal Conversational Debugging Tool for Interactive Visual Exploration of Hierarchical Object Classification",
    authors:
      "Reza Shahriari, Yichi Yang, Danish Nisar Ahmed Tamboli, Michael Perez, Yuheng Zha, Jinyu Hou, Mingkai Deng, Eric D. Ragan, Jaime Ruiz, Daisy Zhe Wang, Zhiting Hu, Eric Xing",
    note: "IEEE Computer Graphics and Applications, 1–13",
    link: "https://doi.org/10.1109/MCG.2025.3598204",
  },
  {
    id: 3,
    year: "2021",
    venue: "Int. J. Computer Assisted Radiology & Surgery",
    title:
      "Evaluating the Reliability and Agreement of a Web-Based Facial Analysis Tool for Rhinoplasty",
    authors:
      "Oguzhan Topsakal, Mustafa Ilhan Akbas, Bria Smith, Michael Perez, Ege Can Guden, Mazhar Mehmet Celikoyar",
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
      "Mazhar Celikoyar, Michael Perez, Mustafa Ilhan Akbaş, Oguzhan Topsakal",
    note: "Aesthetic Surgery Journal",
    link: "https://doi.org/10.1093/asj/sjab190",
  },
  {
    id: 5,
    year: "2021",
    venue: "CARS Conference",
    title:
      "Evaluating Intra and Inter Reliability of a Web-Based Facial Analysis Tool for Rhinoplasty",
    authors:
      "Oguzhan Topsakal, Mustafa Ilhan Akbas, Bria Smith, Michael Perez, Ege Can Guden, Mazhar Mehmet Celikoyar",
    note: "Computer Assisted Radiology and Surgery (CARS) 2021",
    link: "https://pubmed.ncbi.nlm.nih.gov/34146225/",
  },
  {
    id: 6,
    year: "2020",
    venue: "Int. J. Computer Assisted Radiology & Surgery",
    title:
      "Digitizing Rhinoplasty: a web application with three-dimensional preoperative evaluation to assist rhinoplasty surgeons with surgical planning",
    authors:
      "Oguzhan Topsakal, Mustafa Ilhan Akbaş, Doga Demirel, Rafael Nunez, Bria Smith, Michael Perez, Mazhar Celikoyar",
    note: "IJCARS 15(11):1941–1950",
    link: "https://pubmed.ncbi.nlm.nih.gov/32888163/",
  },
  {
    id: 7,
    year: "2020",
    venue: "CARS Congress",
    title:
      "Digitizing Rhinoplasty: A web application for three-dimensional preoperative planning",
    authors:
      "Oguzhan Topsakal, Mustafa Ilhan Akbaş, Doga Demirel, Rafael Nunez, Bria Smith, Michael Perez, Mazhar Celikoyar",
    note: "Computer Assisted Radiology and Surgery (CARS) Congress 2020",
    link: "https://www.cars-int.org/fileadmin/templates/downkoad/CARS2020_PreliminaryProgram_17032020.pdf",
  },
];

// Preprints & class projects — secondary, with downloadable reports.
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
  },
  {
    id: 2,
    year: "2022",
    title: "An Investigation of ADAM: A Stochastic Optimization Method",
    note: "Advanced Machine Learning",
    file: "/files/ADAM_Investigation_Report.pdf",
  },
  {
    id: 3,
    year: "2022",
    title: "Investigation of VideoGAN for Video Generation and Recognition",
    note: "Machine Learning",
    file: "/files/VideoGAN_Investigation_Report.pdf",
  },
  {
    id: 4,
    year: "2021",
    title: "From Here to There — 3D Audio Project",
    note: "3D Audio",
    file: "/files/Visual_3D_Audio_Project_Report.pdf",
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
    details:
      "Improved infrared video resolution via an open-source super-resolution model to classify distant objects. Developed and trained lightweight RGB object-detection models for real-time drone detection on mobile devices.",
  },
  {
    id: 2,
    year: "2023 – Present",
    position: "Research Assistant",
    company:
      "Ruiz HCI & Data Science Research Lab, University of Florida",
    details:
      "Working on two DARPA-funded projects with collaborators across institutions and industry. Trained and tested action-recognition models for an AR task-guidance system (34% F1 in task recognition, mid-range among DARPA performers) and ran usability and cognitive-load evaluations. Built UI and image/video-analysis APIs and trained action-segmentation models for the second project.",
  },
  {
    id: 3,
    year: "2020 – Present",
    position: "Graduate Teaching Assistant",
    company: "CISE Department, University of Florida",
    details:
      "TA for Analysis of Algorithms, Deep Learning for Computer Graphics, Operating Systems, Performant Python Programming, Computational Structures of Computer Graphics, and Data Structures and Algorithms.",
  },
  {
    id: 4,
    year: "2020 – 2023",
    position: "Research Assistant",
    company: "Graphics, Imaging & Light Measurement Lab, University of Florida",
    details:
      "Leveraged adversarial approaches to model 3D motion and behavior from videos for biomedical research, with Dr. Corey Toler-Franklin and Dr. Darragh Devine (UF Psychology).",
  },
  {
    id: 5,
    year: "2019 – 2020",
    position: "Research Assistant",
    company: "Rhinoplasty Research Group, Florida Polytechnic University",
    details:
      "Surveyed 50+ papers documenting facial landmarks and measurements relevant to rhinoplasty, and helped build a web interface for importing, exporting, and displaying feature-point coordinates on 3D facial models.",
  },
];

export const education = [
  {
    id: 1,
    year: "2020 – Present",
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
    title: "Data Science",
    items: ["NumPy", "pandas", "SciPy", "MATLAB"],
  },
  {
    title: "Graphics & 3D Audio",
    items: ["OpenGL", "WebGL", "OpenAL", "Blender"],
  },
  {
    title: "Web Development",
    items: ["React", "JavaScript", "HTML", "CSS", "WordPress"],
  },
  {
    title: "Scientific Writing",
    items: ["LaTeX", "Illustrator", "Photoshop", "SigmaPlot"],
  },
  {
    title: "Languages & Tooling",
    items: ["Python", "C", "C++", "C#", "Java", "F#", "Julia", "Git", "CMake"],
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
    tags: ["FastAPI", "Web", "Video"],
  },
  {
    id: 2,
    title: "Mario Graphics Game",
    subtitle: "2.5D Mario-style game built with WebGL, HTML, and JavaScript.",
    image: "/images/mario-game-square.jpg",
    url: "https://www.youtube.com/watch?v=5lfsQRtfBVY",
    tags: ["WebGL", "Graphics"],
  },
  {
    id: 3,
    title: "2D Visual & 3D Audio Experience",
    subtitle:
      "Children's experience built with OpenGL, OpenAL, and GLFW in Java.",
    image: "/images/audio-game-square.jpg",
    url: "https://www.youtube.com/watch?v=ztOUkMKE2qs",
    tags: ["OpenGL", "OpenAL", "Java"],
  },
  {
    id: 4,
    title: "Twitter Clone",
    subtitle:
      "Twitter clone using the Akka.NET actor model and Suave web framework in F#.",
    image: "/images/twitter-clone-square.jpg",
    url: "https://youtube.com/watch?v=-I0TTJJyyog",
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
    githubLink: "https://github.com/michaelperez023/michaelperez",
    tags: ["React", "Vite"],
  },
];
