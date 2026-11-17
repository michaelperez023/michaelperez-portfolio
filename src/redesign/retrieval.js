// Local, deterministic "inference" for the query-and-attend feature.
// No LLM, no network, no API key — so there's zero cost and zero abuse surface.
// Three tiers: (1) curated topic answers, with synonym expansion and typo
// correction; (2) BM25 over a word-boundary stemmed index of the whole record,
// composed into a prose answer that adapts to the question's shape; (3) an
// honest fallback. Citation markers [[clipId]] point at real timeline clips.

import { allClips, clipById } from "./timelineData";
import { information, workingPapers } from "../data/content";

const thesisPaper = workingPapers.find((p) => p.id === 3);
const enkixPaper = workingPapers.find((p) => p.id === 1);
const temporalPaper = workingPapers.find((p) => p.id === 2);
const companionPaper = workingPapers.find((p) => p.id === 4);

// Synonym map: a query token on the left counts as the canonical term on the
// right, so phrasings we don't literally key on still hit the right topic.
const SYNONYMS = {
  edge: "deploy", production: "deploy", "production-ready": "deploy", ship: "deploy",
  serve: "deploy", serving: "deploy", onnx: "deploy", quantization: "deploy",
  deployed: "deploy", deploying: "deploy", inference: "deploy", embedded: "deploy",
  deployment: "deploy", deployments: "deploy",
  scaling: "scale", scalable: "scale", throughput: "scale", parallel: "scale",
  distributed: "scale", concurrency: "scale", "large-scale": "scale", big: "scale",
  realtime: "real-time", latency: "real-time", streaming: "real-time",
  fast: "real-time", interactive: "real-time",
  videos: "video", footage: "video", "long-video": "video", clip: "video",
  understanding: "video", segmentation: "video", retrieval: "video",
  explainability: "explainable", interpretable: "explainable", interpretability: "explainable",
  transparent: "explainable", xai: "explainable",
  pipeline: "systems", pipelines: "systems", backend: "systems", infrastructure: "systems",
  fastapi: "systems", docker: "systems", engineering: "systems",
  engineer: "systems",
  mlops: "raft tooling", kubernetes: "raft tooling", k8s: "kubernetes raft tooling",
  airflow: "raft tooling", mlflow: "raft tooling", fiftyone: "raft tooling",
  labelstudio: "raft tooling", "label-studio": "raft tooling", "fifty-one": "raft tooling",
  paper: "publication", papers: "publication", published: "publication", publish: "publication",
  publications: "publication", peer: "publication", "first-author": "first author",
  language: "nlp", summarization: "nlp", summarisation: "nlp", text: "nlp",
  transformer: "nlp", transformers: "nlp",
  algorithm: "algorithms", "data-structures": "algorithms", complexity: "algorithms",
  sorting: "algorithms", clustering: "algorithms",
  teach: "teaching", mentor: "teaching", mentoring: "teaching", students: "teaching",
  instructor: "teaching", ta: "teaching",
  opengl: "graphics", webgl: "graphics", rendering: "graphics", render: "graphics",
  tessellation: "graphics", shaders: "graphics",
  medical: "medical", imaging: "medical", surgery: "medical", surgical: "medical",
  rhinoplasty: "medical", clinical: "medical", healthcare: "medical",
  optimizer: "optimization", optimisation: "optimization", adam: "optimization",
  gradient: "optimization", sgd: "optimization", training: "optimization",
  gan: "generative", gans: "generative", generation: "generative", synthesis: "generative",
  diffusion: "generative",
  languages: "programming", coding: "programming", "c++": "programming", fsharp: "programming",
  python: "programming", java: "programming",
  darpa: "darpa", funded: "darpa", grant: "darpa",
  ar: "augmented reality", augmented: "augmented reality", hud: "augmented reality",
  drone: "detection", detection: "detection", "super-resolution": "super-resolution",
  superresolution: "super-resolution", infrared: "super-resolution", covar: "internship",
  internship: "internship", intern: "internship",
  hire: "hiring", hiring: "hiring", "hire-readiness": "hiring", candidate: "hiring",
  strengths: "hiring", "why-you": "hiring",
  available: "availability", availability: "availability", remote: "availability",
  relocate: "availability", "open-to-work": "availability", start: "availability",
  data: "datascience", numpy: "datascience", pandas: "datascience", analysis: "datascience",
  reviewer: "service", review: "service", "peer-review": "service", chair: "service",
  ai: "machine learning", ml: "machine learning", pytorch: "machine learning",
  tensorflow: "machine learning", keras: "machine learning", huggingface: "machine learning",
  neural: "machine learning", cnn: "machine learning", cnns: "machine learning",
  deep: "machine learning", vision: "machine learning", artificial: "machine learning",
};

const TOPICS = [
  {
    keys: ["enkix", "intelligent ar task guidance"],
    specific: true,
    answer: `${enkixPaper.title}: ${enkixPaper.note} [[r-enkix]]. The system provides real-time AR task guidance with cognitive-load-adaptive behavior. Recognizing task steps live is a difficult problem: in DARPA's multi-team evaluation our models reached 34% F1, a mid-range result among the performer teams.`,
    attend: ["r-enkix"],
  },
  {
    keys: ["efficient video action detection", "action detection", "online action", "streaming", "thumos", "mamba", "state-space"],
    specific: true,
    answer: `My Ph.D. thesis, ${thesisPaper.title}, presents a causal, online action-detection model. On THUMOS it matches the strongest verified strictly-causal detector at roughly 60% of its parameters and 2.4× its throughput, and it runs in real time at 37.7 FPS [[r-thesis]]. A first-author manuscript is in preparation.`,
    attend: ["r-thesis"],
  },
  {
    keys: ["raft tooling", "kubernetes", "k8s", "mlops", "airflow", "mlflow", "label studio", "labelstudio", "fiftyone", "fifty one"],
    specific: true,
    answer:
      "At Raft, I worked with Kubernetes, Airflow, MLflow, Label Studio, and FiftyOne, alongside MLOps practices. My work included computer vision data exploration and analysis in production software, dataset curation, annotation review, model analysis, evaluation, and debugging [[e-raft]].",
    attend: ["e-raft"],
  },
  {
    keys: ["under review", "in review", "in preparation", "in prep", "working paper", "working papers", "manuscript", "manuscripts", "submitted", "chi", "companion agents"],
    specific: true,
    answer: `${companionPaper.title}: ${companionPaper.note} [[r-hai-prep]]. Three more manuscripts are in preparation: ${enkixPaper.title} [[r-enkix]], ${temporalPaper.title} [[r-temporal]], and ${thesisPaper.title} [[r-thesis]].`,
    attend: ["r-hai-prep", "r-enkix", "r-temporal", "r-thesis"],
  },
  {
    keys: ["certification", "certifications", "certified", "certificate", "security+", "comptia", "security plus"],
    specific: true,
    answer: "I hold the CompTIA Security+ certification, earned in October 2026. It is listed with my education and honors in the About section.",
    attend: [],
  },
  {
    keys: ["llm", "llms", "vlm", "vlms", "vision-language", "vision language", "multimodal", "generative ai", "genai", "langchain", "llava", "qwen", "llama", "lavila", "large language model", "large language models", "foundation model", "foundation models"],
    specific: true,
    answer:
      "I've applied vision-language and LLM-based models in my DARPA video work. In CReLeRI I used LLaMA to parse Qwen-generated captions [[r-creleri]], and for ENKIx I fine-tuned the video-language model LaViLa for action recognition [[r-enkix]]. I've also used LangChain with Pydantic to structure LLM outputs. These were existing pretrained models that I applied and fine-tuned, not models I trained from scratch.",
    attend: ["r-creleri", "r-enkix"],
  },
  {
    // Questions about the simulator's size get this, never the general "scale" answer.
    keys: ["gossip", "push-sum", "push sum", "pushsum", "node", "nodes"],
    specific: true,
    answer:
      "The gossip and push-sum simulator is a 2021 course project that Blas Kojusner and I wrote in F#: every node in the network is an Akka.NET actor, and it runs two protocols, gossip (rumor spreading) and push-sum (averaging), on full, line, 3D, and imperfect-3D topologies [[p-gossip]]. I don't quote node counts or timings for it until I've measured the revised version.",
    attend: ["p-gossip"],
  },
  {
    keys: ["twitter", "suave"],
    specific: true,
    answer:
      "The Twitter clone is a two-part 2021 course project that Blas Kojusner and I wrote in F#. Part I runs the engine and a load simulator as Akka.NET actor systems that talk over Akka.Remote; Part II adds a Suave web interface with a JSON API and live WebSocket feeds [[p-twitter]].",
    attend: ["p-twitter"],
  },
  {
    keys: ["thesis", "dissertation"],
    specific: true,
    answer: `My Ph.D. thesis, ${thesisPaper.title}, presents a causal, online action-detection model that matches the strongest verified strictly-causal detector on THUMOS at roughly 60% of its parameters and 2.4× its throughput, in real time [[r-thesis]]. ${enkixPaper.title} is also thesis work [[r-enkix]]. Both are first-author manuscripts in preparation.`,
    attend: ["r-enkix", "r-thesis"],
  },
  {
    // After the project topics above, which answer "did you build X alone?" for X themselves.
    keys: ["alone", "solo", "by yourself", "on your own", "teammate", "teammates", "team project", "team projects", "group project", "group projects", "teamwork", "who helped", "kojusner", "blas", "lapensee", "ghaffarian"],
    specific: true,
    answer:
      "Several of my projects were team work. Blas Kojusner and I wrote the Twitter clone [[p-twitter]] and the gossip and push-sum simulator [[p-gossip]]. I made From Here to There with Troy Lapensee and Lauren Newman [[p-audio3d]], and Hermes Tracker was a team app by Adam Ghaffarian, me, and Jared Fuller, where I wrote the Letters menu and the Scan button [[p-hermes]]. The Urdu headline-generation project was with Ammar Amjad, Mohammad Uzair Fasih, and Mohammad Anas; my part was mainly the report and the presentation [[r-urdu]]. I wrote the arXiv survey with Corey Toler-Franklin [[r-animal]], and CReLeRI was a team effort with my co-authors [[r-creleri]].",
    attend: ["p-twitter", "p-gossip", "p-audio3d", "p-hermes", "r-urdu", "r-animal", "r-creleri"],
  },
  {
    keys: ["scale", "distributed training", "multi-gpu"],
    answer:
      "For my Ph.D. thesis I ran distributed multi-GPU training on a SLURM-managed HPC cluster and benchmarked five video models for mAP, throughput, memory, and FLOPs [[r-thesis]]. At the Ruiz HCI Lab I built scalable pipelines for video processing, training, and inference [[e-ruiz]], and I designed CReLeRI around a FastAPI + Celery/Redis job queue so long videos are analyzed in the background [[p-creleri-site]].",
    attend: ["r-thesis", "e-ruiz", "p-creleri-site"],
  },
  {
    keys: ["real-time"],
    answer:
      "Real-time is the core of my work. My Ph.D. thesis model detects actions online at 37.7 FPS [[r-thesis]]. ENKIx is a cognitive-load-adaptive AR task-guidance system that runs live and was tested in a multi-team DARPA evaluation [[r-enkix]]. At CoVar I trained lightweight RGB detectors targeting real-time, on-device drone detection [[e-covar]].",
    attend: ["r-thesis", "r-enkix", "e-covar"],
  },
  {
    keys: ["deploy"],
    answer:
      "My work spans production ML software and model evaluation. At Raft I integrated computer vision data exploration and analysis into production software, and worked with Kubernetes, Airflow, MLflow, Label Studio, and FiftyOne alongside MLOps practices [[e-raft]]. At CoVar I trained lightweight RGB detectors targeting real-time, on-device use and built offline CV evaluation pipelines [[e-covar]]. ENKIx runs live on AR hardware [[r-enkix]], and for CReLeRI I designed a system of model services with a FastAPI + Celery/Redis job queue, containerized with Docker in the lab [[p-creleri-site]].",
    attend: ["e-raft", "e-covar", "r-enkix", "p-creleri-site"],
  },
  {
    keys: ["video", "video analysis"],
    answer:
      "Video understanding was the focus of my Ph.D. CReLeRI is an explainable, concept-centric long-video analysis system, and I am first author of its ACM Multimedia 2025 demo [[r-creleri]]. I also study temporal granularity as a design variable for zero-shot video retrieval [[r-temporal]], and co-authored MuCHEx, a conversational tool for interactive visual exploration of hierarchical object classification [[r-muchex]].",
    attend: ["r-creleri", "r-temporal", "r-muchex"],
  },
  {
    keys: ["machine learning", "computer vision", "deep learning"],
    answer:
      "I'm a machine learning and computer vision engineer with a Ph.D. in Computer Science. My work includes computer vision data exploration and evaluation workflows in production software at Raft [[e-raft]], CReLeRI, an explainable video-understanding system (first-author demo, ACM Multimedia 2025) [[r-creleri]], and real-time drone detection and infrared super-resolution at CoVar (MSS 2026) [[e-covar]]. My doctoral research used PyTorch across two DARPA-funded programs [[e-ruiz]].",
    attend: ["e-raft", "r-creleri", "e-covar", "e-ruiz"],
  },
  {
    keys: ["darpa"],
    answer:
      "Two DARPA-funded programs at the Ruiz HCI Lab [[e-ruiz]]: CReLeRI, an explainable long-video analysis system presented as a demo at ACM Multimedia 2025 [[r-creleri]], and ENKIx, a real-time AR task-guidance system [[r-enkix]].",
    attend: ["e-ruiz", "r-creleri", "r-enkix"],
  },
  {
    keys: ["explainable"],
    answer:
      "I work on systems people can actually inspect. CReLeRI is concept-centric and explainable end to end: it shows the evidence for every action it reports [[r-creleri]]. I also co-authored MuCHEx, a conversational debugging tool for visually exploring why a hierarchical classifier decides what it does [[r-muchex]].",
    attend: ["r-creleri", "r-muchex"],
  },
  {
    keys: ["systems"],
    answer:
      "I'm a systems-minded ML engineer. At Raft I integrated computer vision data exploration into production software and built ML data management and evaluation workflows. My stack there included Kubernetes, Airflow, MLflow, Label Studio, and FiftyOne, alongside MLOps practices [[e-raft]]. Other systems work includes the CReLeRI video analysis system, whose architecture I designed: model services with a FastAPI + Celery/Redis job queue, containerized with Docker in the lab [[p-creleri-site]]; offline CV evaluation pipelines at CoVar [[e-covar]]; and a gossip and push-sum simulator in F# with Akka.NET actors, written with Blas Kojusner [[p-gossip]].",
    attend: ["e-raft", "p-creleri-site", "e-covar", "p-gossip"],
  },
  {
    keys: ["first author"],
    answer:
      "My published first-author work includes the CReLeRI demo at ACM Multimedia 2025 [[r-creleri]] and a Military Sensing Symposium 2026 paper on infrared super-resolution [[r-superres]]. ENKIx [[r-enkix]] and Efficient Video Action Detection [[r-thesis]] are also Ph.D. thesis work, with first-author manuscripts in preparation.",
    attend: ["r-creleri", "r-superres", "r-enkix", "r-thesis"],
  },
  {
    keys: ["flagship", "creleri", "best work", "video analysis system", "video analysis website"],
    answer:
      "CReLeRI — my first-author demo at ACM Multimedia 2025: an explainable, concept-centric system for representation, learning, reasoning and interaction over long video [[r-creleri]]. The complete system, whose architecture I designed, is open source [[p-creleri-site]].",
    attend: ["r-creleri", "p-creleri-site"],
  },
  {
    keys: ["super-resolution", "detection"],
    answer:
      "At CoVar I applied infrared video super-resolution to improve long-range object classification (published at MSS 2026) [[r-superres]] and trained lightweight drone detectors targeting real-time, on-device use [[e-covar]].",
    attend: ["r-superres", "e-covar"],
  },
  {
    keys: ["algorithms", "k-means"],
    answer:
      "Strongly — my CS training is algorithms-heavy. I've been a TA for Analysis of Algorithms and for Data Structures and Algorithms and built automated grading tools for 100+ students [[e-ta]], and I wrote a survey of the k-means clustering problem for an algorithms course [[r-kmeans]].",
    attend: ["e-ta", "r-kmeans"],
  },
  {
    keys: ["teaching"],
    answer:
      "I was a graduate teaching assistant from 2020 to 2026 across algorithms, data structures, operating systems, Python and deep-learning-for-graphics courses — building automated grading tools and supporting 100+ students [[e-ta]].",
    attend: ["e-ta"],
  },
  {
    keys: ["nlp", "headline", "headlines", "headline generation", "urdu", "mt5"],
    answer:
      "On the NLP side, in a class project with Ammar Amjad, Mohammad Uzair Fasih, and Mohammad Anas, our team fine-tuned mT5 to write Urdu news headlines from the articles' short summaries; my part was mainly the report and the presentation [[r-urdu]]. I also work with Transformers and Hugging Face models in my video-language research [[r-creleri]].",
    attend: ["r-urdu", "r-creleri"],
  },
  {
    keys: ["graphics", "mario", "nintendo"],
    answer:
      "Plenty of graphics and real-time rendering: Escape the Maze, a first-person WebGL game with Mario characters (a fan project, not affiliated with Nintendo) [[p-mario]], an OpenGL tessellation scene [[p-graphics]], and From Here to There, a 2D-visual, 3D-audio experience in OpenGL and OpenAL that I made with Troy Lapensee and Lauren Newman [[p-audio3d]]. I've also been a TA for graphics courses.",
    attend: ["p-mario", "p-graphics", "p-audio3d"],
  },
  {
    keys: ["medical"],
    answer:
      "Early on I worked on computer-assisted rhinoplasty in the Rhinoplasty Research Group at Florida Poly: I helped build a web-based 3D facial analysis tool, published in IJCARS [[r-rhino-eval]], [[r-rhino-digit]], and co-authored an article on facial anthropometric features and measurements in the Aesthetic Surgery Journal [[r-rhino-anthro]].",
    attend: ["r-rhino-eval", "r-rhino-digit", "r-rhino-anthro"],
  },
  {
    keys: ["optimization"],
    answer:
      "I dug into optimization directly: for an advanced ML course I implemented Adam and AdaMax in PyTorch and compared them on MNIST, and the repository now has five-seed results that correct my original report [[r-adam]]. I've also trained and fine-tuned video models throughout my research [[r-creleri]].",
    attend: ["r-adam", "r-creleri"],
  },
  {
    keys: ["generative", "videogan"],
    answer:
      "For a machine learning course I trained VideoGAN from scratch on golf-course videos on UF's HiPerGator cluster and reused its discriminator for action recognition; the repository corrects my original report [[r-videogan]]. That work sits alongside my broader video-understanding research [[r-creleri]].",
    attend: ["r-videogan", "r-creleri"],
  },
  {
    keys: ["programming", "stack", "tools"],
    answer:
      "I've worked in Python, C++, F#, Java, JavaScript, C, C#, SQL and Julia. A few examples: my CV/ML research in Python [[r-creleri]], a gossip and push-sum simulator in F# with Akka.NET, written with Blas Kojusner [[p-gossip]], and Escape the Maze, a WebGL game in JavaScript [[p-mario]].",
    attend: ["r-creleri", "p-gossip", "p-mario"],
  },
  {
    keys: ["augmented reality"],
    answer:
      "ENKIx is Ph.D. thesis work and a first-author manuscript in preparation. It is an intelligent AR task-guidance system with cognitive-load-adaptive HUD behavior, running in real time and tested in a multi-team DARPA evaluation [[r-enkix]].",
    attend: ["r-enkix"],
  },
  {
    keys: ["raft", "at raft", "dataset exploration", "data exploration", "dataset curation", "annotation review", "geospatial", "natural-language querying", "natural language querying"],
    answer:
      "I worked as a Senior Engineer at Raft from August to November 2026. I developed and integrated computer vision data exploration and analysis into production software, including dataset visualization, clustering, filtering, natural-language querying, and geospatial analytics. I built ML data management and evaluation workflows for dataset curation, annotation review, model analysis, and debugging, and contributed to AI/ML development, testing, and integration, including object-detection experimentation and software improvements. I worked with Kubernetes, Airflow, MLflow, Label Studio, and FiftyOne, alongside MLOps practices [[e-raft]].",
    attend: ["e-raft"],
  },
  {
    keys: ["industry"],
    answer:
      "My industry experience includes a Senior Engineer role at Raft (August–November 2026), where I integrated computer vision data exploration into production software and built ML data management and evaluation workflows [[e-raft]], and an ML engineering internship at CoVar (May–August 2025), focused on infrared video super-resolution, real-time drone detection, and offline computer vision evaluation pipelines [[e-covar]].",
    attend: ["e-raft", "e-covar"],
  },
  {
    keys: ["internship"],
    answer:
      "I interned at CoVar (summer 2025) as an ML Engineer: infrared video super-resolution for long-range classification (MSS 2026) [[r-superres]], lightweight drone detectors targeting real-time, on-device use, and offline CV evaluation pipelines [[e-covar]].",
    attend: ["e-covar", "r-superres"],
  },
  {
    keys: ["datascience"],
    answer:
      "I work in NumPy, pandas, SciPy, MATLAB and Jupyter. I used them to build evaluation pipelines and analysis for my CV/ML research [[e-ruiz]], and for offline CV metric analysis at CoVar [[e-covar]].",
    attend: ["e-ruiz", "e-covar"],
  },
  {
    keys: ["service", "peer review"],
    answer:
      "I serve the community as a peer reviewer for ACM Multimedia 2025, ACM ICMR 2026, and ICXR 2026, co-chaired UF's Human-Centered Data Science Seminar, and reviewed for IEEE VR in 2024. My service is listed in the List view and on my CV.",
    attend: [],
  },
  {
    // Only when no other topic matches, so "the ADAM paper" still gets the ADAM answer.
    keys: ["publication", "publications", "published", "papers"],
    fallback: true,
    answer:
      "As first author, I published the CReLeRI demo at ACM Multimedia 2025 [[r-creleri]] and a Military Sensing Symposium 2026 paper on infrared super-resolution [[r-superres]]. I'm a co-author of MuCHEx in IEEE Computer Graphics and Applications (2025) [[r-muchex]], of two IJCARS articles on computer-assisted rhinoplasty [[r-rhino-eval]], [[r-rhino-digit]], and of an Aesthetic Surgery Journal article on facial anthropometry [[r-rhino-anthro]]. I also wrote an arXiv survey with Corey Toler-Franklin [[r-animal]].",
    attend: ["r-creleri", "r-superres", "r-muchex", "r-rhino-eval", "r-rhino-digit", "r-rhino-anthro", "r-animal"],
  },
  {
    keys: ["hiring", "why hire", "strengths", "good fit", "stand out"],
    answer:
      `${information.availability} I combine ML research with production engineering: at Raft, I integrated computer vision data exploration into production software and built dataset curation and evaluation workflows [[e-raft]]. My work also includes a first-author demo at ACM Multimedia 2025 [[r-creleri]], published infrared video super-resolution research from my CoVar internship [[e-covar]], and a Ph.D. thesis model that detects actions online, in real time [[r-thesis]].`,
    attend: ["e-raft", "r-creleri", "e-covar", "r-thesis"],
  },
  {
    keys: ["availability", "graduate", "when", "start", "relocate", "relocation", "tampa"],
    answer:
      `${information.availability} I'm based in ${information.location} and completed my Ph.D. in Computer Science at UF in August 2026. My most recent industry role was Senior Engineer at Raft, from August to November 2026 [[e-raft]]. See the Contact section to connect.`,
    attend: ["e-raft"],
  },
];

// Per-clip search keywords beyond the clip's own text.
const AUGMENT = {
  "e-ta": "teaching mentor students algorithms data structures operating systems python grading",
  "r-kmeans": "algorithms clustering unsupervised complexity survey",
  "p-gossip": "distributed concurrency actor parallel convergence fsharp akka",
  "r-urdu": "nlp natural language summarization text news headline headlines mt5 urdu teammates",
  "r-videogan": "generative gan video generation synthesis",
  "r-adam": "optimization optimizer gradient descent training stochastic",
  "p-mario": "graphics opengl webgl rendering game maze javascript browser",
  "p-graphics": "graphics opengl tessellation rendering scene",
  "p-audio3d": "graphics opengl openal audio spatial sound 3d",
  "p-surgery": "graphics opengl simulation medical surgery",
  "p-twitter": "distributed actor akka fsharp concurrency",
  "r-rhino-eval": "medical imaging surgery facial rhinoplasty healthcare clinical 3d",
  "r-rhino-anthro": "medical imaging surgery facial rhinoplasty anthropometric",
  "r-rhino-digit": "medical imaging surgery facial rhinoplasty 3d web",
  "e-covar": "internship industry detection real-time super resolution infrared evaluation deploy",
  "r-creleri": "video understanding explainable multimodal transformer language reasoning llm vlm llama qwen captions fastapi celery redis docker",
  "r-superres": "super resolution infrared detection classification standoff",
  "r-enkix": "augmented reality ar real-time cognitive load guidance hud phd thesis dissertation first author manuscript in preparation",
  "p-hermes": "flutter mobile dart app tracking mail packages letters barcode teammates web demo",
  "r-temporal": "video retrieval zero-shot temporal granularity",
  "p-brisal": "booking website astro villa rental hospitality travel dominican republic jarabacoa bilingual spanish",
  "e-raft": "raft senior engineer tampa florida industry production computer vision dataset visualization exploration analysis clustering filtering natural language querying geospatial analytics data management curation annotation review model evaluation debugging object detection experimentation testing integration kubernetes k8s mlops airflow mlflow label studio labelstudio fiftyone fifty one",
  "r-thesis": "efficient video action detection thesis dissertation first author manuscript in preparation benchmark map latency throughput memory flops online streaming causal state-space mamba thumos real-time fps parameters efficiency",
  "r-hai-prep": "human agent interaction companion agents user experience mental workload user study chi under review submitted hci",
};

const STOP = new Set(
  "do you know can are is the a an of what about your you're with and to me my our show tell have has had any in on for im how does did would could should will give get list some good at use used using familiar done worked ever".split(/\s+/)
);
const SHORT_OK = new Set(["ml", "ai", "ar", "cv", "ros", "gan", "hpc", "nlp", "3d", "c++", "f#", "c#", "go"]);
const stem = (w) => w.replace(/(ing|ers|er|ed|s)$/i, "");

// Word-boundary tokens (stemmed, stopworded) — never substrings, so a short
// query like "ai" can't match the inside of "training".
function toks(s) {
  return String(s)
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean)
    .filter((w) => !STOP.has(w) && (w.length >= 3 || SHORT_OK.has(w)))
    .map(stem);
}

// Names that must match as a whole: "class report" is one term, so a question about
// taking or teaching a class does not match the class reports, and "Node.js" is not
// the "node" of the gossip simulator.
const PHRASES = [
  [/\b(?:class|course)[\s-]+reports?\b/gi, "classreport"],
  [/\bnode\.?js\b/gi, "nodejs"],
];
const joinPhrases = (s) => PHRASES.reduce((acc, [re, term]) => acc.replace(re, term), String(s));
const PHRASE_TERMS = new Set(PHRASES.map(([, term]) => term)); // known words, never typo-corrected
const PHRASE_STEMS = new Set([...PHRASE_TERMS].map(stem));

// --- BM25 index over every clip, with field weighting (title > tags > rest) ---
const DOCS = allClips.map((c) => {
  const tf = new Map();
  const add = (text, w) => toks(text).forEach((t) => tf.set(t, (tf.get(t) || 0) + w));
  add(c.title || "", 3);
  add([(c.tags || []).join(" "), c.tag, c.kind && joinPhrases(c.kind)].filter(Boolean).join(" "), 2);
  add(
    [c.venue, c.note, c.authors, c.sub, c.details, c.company, c.position, c.track, c.year, AUGMENT[c.id] || ""]
      .filter(Boolean)
      .join(" "),
    1
  );
  let len = 0;
  tf.forEach((v) => (len += v));
  const yr = parseInt(String(c.year || "").slice(0, 4), 10) || 0;
  return { id: c.id, track: c.track, lead: !!c.lead, year: yr, tf, len };
});
const AVGLEN = DOCS.reduce((a, d) => a + d.len, 0) / DOCS.length;
const DF = new Map();
DOCS.forEach((d) => d.tf.forEach((_, t) => DF.set(t, (DF.get(t) || 0) + 1)));
const VOCAB = [...DF.keys()];
const idf = (t) => {
  const df = DF.get(t) || 0;
  return df ? Math.log(1 + (DOCS.length - df + 0.5) / (df + 0.5)) : 0;
};

// --- typo tolerance: nearest known term within a small edit distance ---
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function nearest(word, candidates) {
  if (word.length < 4 || /^\d+$/.test(word)) return null;
  let best = null;
  // conservative: distance 2 only on long words, or real words get "corrected"
  // into vocabulary (e.g. weaving -> serving)
  let bestD = word.length >= 8 ? 2 : 1;
  for (const c of candidates) {
    const d = editDistance(word, c, bestD);
    if (d <= bestD && (d < bestD || best === null)) {
      bestD = d;
      best = c;
      if (d === 0) break;
    }
  }
  return best;
}

// Vocabulary the topic matcher understands (for typo-correcting the query).
const KEY_VOCAB = [
  ...new Set([
    ...Object.keys(SYNONYMS),
    ...TOPICS.flatMap((t) => t.keys.flatMap((k) => k.split(" "))),
  ]),
];

// Expand a query: fix near-miss typos against known vocabulary, then append
// canonical synonyms so phrasings we don't literally key on still hit topics.
function expand(q) {
  const words = q.toLowerCase().split(/[^a-z0-9+#-]+/).filter(Boolean);
  const extra = [];
  const fixed = words.map((w) => {
    let t = w;
    if (!STOP.has(t) && !SYNONYMS[t] && !PHRASE_TERMS.has(t) && t.length >= 5 && !DF.has(stem(t))) {
      t = nearest(t, KEY_VOCAB) || nearest(stem(t), VOCAB) || t;
    }
    if (SYNONYMS[t]) extra.push(SYNONYMS[t]);
    return t;
  });
  return `${fixed.join(" ")} ${extra.join(" ")}`.trim();
}

// Match a topic key at word boundaries ("scale" shouldn't fire inside "scaled-up" text randomly).
function hasKey(q, k) {
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(q);
}

const JOB_HINTS = ["job", "role", "work", "intern", "experience", "position", "employ", "ta", "assistant", "career"];

// BM25 over the record. Returns the top ids plus how much of the ORIGINAL
// query the best document actually covered (drives honest answer phrasing).
function generalSearch(raw, expanded) {
  const fix = (t) => (DF.has(t) || PHRASE_STEMS.has(t) ? t : nearest(t, VOCAB) || t);
  const origTs = [...new Set(toks(raw).map(fix))];
  const ts = [...new Set([...origTs, ...toks(expanded).map(fix)])];
  if (!ts.length) return null;
  const jobRelevant = JOB_HINTS.some((h) => raw.toLowerCase().includes(h));
  const K1 = 1.4;
  const B = 0.6;
  const scored = DOCS.map((d) => {
    let s = 0;
    let origHits = 0;
    for (const t of ts) {
      const f = d.tf.get(t) || 0;
      if (!f) continue;
      if (origTs.includes(t)) origHits++;
      s += idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / AVGLEN)));
    }
    if (d.track === "experience" && !jobRelevant) s *= 0.35; // don't surface jobs for topical queries
    if (s > 0) {
      if (d.lead) s *= 1.5; // surface first-author work
      if (d.year >= 2024) s *= 1.25; // and recent work over older papers
    }
    return { id: d.id, s, origHits };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  if (!scored.length) return null;
  return {
    ids: scored.slice(0, 3).map((x) => x.id),
    coverage: origTs.length ? scored[0].origHits / origTs.length : 0,
  };
}

// One line of grounding context for a cited clip in a composed answer.
function clipContext(c) {
  if (c.track === "research") return [c.venue || c.note, c.kind === "working" ? null : c.year].filter(Boolean).join(", ");
  if (c.track === "experience") return [c.company, c.year].filter(Boolean).join(", ");
  return [(c.tags || [])[0], c.year].filter(Boolean).join(", ");
}

// "do you know X / experience with X / what about X" → capture X so the answer
// can respond to the question instead of echoing it.
const ASK_RE =
  /^(?:do (?:you|u) (?:know|have|use)|have you (?:used|worked with|done|tried)|any experience (?:with|in)|experience (?:with|in)|what about|how about|familiar with|worked with|know|used?)\s+(.+?)[?.!]*$/i;

// Other yes/no questions ("did you…", "is it…"). Their words showing up in my work
// does not make the answer "yes", so they get the neutral opener.
const YES_NO_RE = /^(?:did|does|do|is|was|were|are|can|could|has|have|had|will|would|should)\b/i;

function composeGeneral(raw, ids, coverage) {
  const frags = ids.map((id) => {
    const ctx = clipContext(clipById[id]);
    return `[[${id}]]${ctx ? ` (${ctx})` : ""}`;
  });
  const list = frags.length > 1 ? `${frags.slice(0, -1).join("; ")}; and ${frags[frags.length - 1]}` : frags[0];
  const m = raw.trim().match(ASK_RE);
  const subject = m ? m[1].trim() : null;
  const strong = coverage >= 0.99;
  let opener;
  if (subject && strong) opener = `Yes — ${subject} shows up directly in my work:`;
  else if (subject) opener = `${subject} isn't a headline topic of mine, but the closest work I have:`;
  else if (strong && !YES_NO_RE.test(raw.trim())) opener = `Here's where that shows up in my work:`;
  else opener = `Closest matches in my work for “${raw.trim()}”:`;
  return { answer: `${opener} ${list}.`, attend: ids, matched: strong };
}

const FALLBACK = {
  answer:
    "I don't have that exact topic indexed — but here's the shape of my work: video understanding and real-time ML, the CReLeRI demo at ACM Multimedia 2025 [[r-creleri]], computer vision data tooling in production software at Raft [[e-raft]], CV research at CoVar [[e-covar]], and my Ph.D. thesis on real-time online action detection [[r-thesis]]. Try real-time, deployment, scale, video, algorithms, or DARPA.",
  attend: ["r-creleri", "e-raft", "e-covar", "r-thesis"],
  matched: false,
};

export const examples = [
  "Can you scale?",
  "Do you deploy models?",
  "Do you know algorithms?",
  "What about long video?",
  "Why should we hire you?",
];

// tier reports which retrieval path actually answered — shown honestly in the
// HUD (no simulated metrics): "curated" | "keyword" | "overview".
export function runQuery(raw) {
  if (!raw || !raw.trim()) return null;
  const text = joinPhrases(raw);
  const q = expand(text); // typo-corrected + synonym-expanded

  // 1) curated topics, matched at word boundaries
  let best = null;
  let bestScore = 0;
  let fallback = null; // a fallback topic answers only when no other topic matches
  for (const topic of TOPICS) {
    let score = 0;
    for (const k of topic.keys) if (hasKey(q, k)) score += k.length;
    if (score > 0 && topic.fallback) {
      fallback = fallback || topic;
      continue;
    }
    // Specific research/tooling questions take precedence over broad ML/system terms.
    if (score > 0 && topic.specific) {
      return { answer: topic.answer, attend: topic.attend, matched: true, tier: "curated" };
    }
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  best = best || fallback;
  if (best) return { answer: best.answer, attend: best.attend, matched: true, tier: "curated" };

  // 2) BM25 over the whole record, composed into a question-aware answer
  const hit = generalSearch(text, q);
  if (hit) {
    const ids = hit.ids.filter((id) => clipById[id]);
    if (ids.length) return { ...composeGeneral(raw, ids, hit.coverage), tier: "keyword" };
  }

  // 3) graceful fallback
  return { answer: FALLBACK.answer, attend: FALLBACK.attend, matched: FALLBACK.matched, tier: "overview" };
}

// --- documents for the optional in-browser semantic layer (semantic.js) ---
const stripCites = (s) => s.replace(/\[\[[^\]]+\]\]/g, "").replace(/\s+/g, " ").trim();
export const topicDocs = TOPICS.map((t) => ({
  answer: t.answer,
  attend: t.attend,
  text: `${t.keys.join(", ")}. ${stripCites(t.answer)}`,
}));
export const clipDocs = allClips.map((c) => ({
  id: c.id,
  text: [
    c.title, c.venue, c.note, c.sub, c.details, c.company, c.position,
    (c.tags || []).join(", "), AUGMENT[c.id] || "",
  ]
    .filter(Boolean)
    .join(". "),
}));
export { composeGeneral };

// Split an answer into tokens; [[id]] markers become citation tokens.
export function tokenize(answer) {
  const tokens = [];
  for (const part of answer.split(/(\[\[[^\]]+\]\])/g)) {
    const m = part.match(/^\[\[([^\]]+)\]\]$/);
    if (m) {
      tokens.push({ type: "cite", id: m[1] });
    } else {
      for (const w of part.split(/(\s+)/)) {
        if (w === "") continue;
        tokens.push({ type: "text", text: w });
      }
    }
  }
  return tokens;
}
