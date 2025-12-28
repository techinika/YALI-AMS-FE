import {
  Target,
  Heart,
  Code,
  BookOpen,
  Music,
  Camera,
  Globe,
  Brain,
  FlaskRound,
  Palette,
  Dumbbell,
  Microscope,
  Atom,
  PenLine,
  GraduationCap,
  Wallet,
  Landmark,
  Leaf,
  BookText,
  Wrench,
  Cpu,
  Smartphone,
  ChartLine,
  Rocket,
  Gamepad2,
  Shield,
  Briefcase,
  Cloud,
  Database,
  Video,
} from "lucide-react";
import {
  MdAgriculture,
  MdGrass,
  MdScience,
  MdHistoryEdu,
} from "react-icons/md";

export const AVAILABLE_INTERESTS = [
  // --- Existing ---
  { id: "tech", label: "Technology", icon: <Code className="w-4 h-4" /> },
  { id: "art", label: "Digital Art", icon: <Camera className="w-4 h-4" /> },
  {
    id: "business",
    label: "SaaS & Startups",
    icon: <Target className="w-4 h-4" />,
  },
  {
    id: "edu",
    label: "Learning & Education",
    icon: <BookOpen className="w-4 h-4" />,
  },
  { id: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
  {
    id: "wellness",
    label: "Health & Wellness",
    icon: <Heart className="w-4 h-4" />,
  },
  {
    id: "agriculture",
    label: "Agriculture",
    icon: <MdAgriculture className="w-4 h-4" />,
  },
  {
    id: "animal-farming",
    label: "Animal Farming",
    icon: <MdGrass className="w-4 h-4" />,
  },

  // --- New Expanded Academic & Research ---
  { id: "science", label: "Science", icon: <MdScience className="w-4 h-4" /> },
  {
    id: "research",
    label: "Research & Innovation",
    icon: <Microscope className="w-4 h-4" />,
  },
  { id: "physics", label: "Physics", icon: <Atom className="w-4 h-4" /> },
  { id: "biology", label: "Biology", icon: <Leaf className="w-4 h-4" /> },
  {
    id: "chemistry",
    label: "Chemistry",
    icon: <FlaskRound className="w-4 h-4" />,
  },
  {
    id: "mathematics",
    label: "Mathematics",
    icon: <Brain className="w-4 h-4" />,
  },
  {
    id: "engineering",
    label: "Engineering",
    icon: <Wrench className="w-4 h-4" />,
  },

  // --- Social Sciences & Humanities ---
  {
    id: "history",
    label: "History",
    icon: <MdHistoryEdu className="w-4 h-4" />,
  },
  {
    id: "politics",
    label: "Politics & Governance",
    icon: <Landmark className="w-4 h-4" />,
  },
  {
    id: "languages",
    label: "Languages",
    icon: <BookText className="w-4 h-4" />,
  },
  {
    id: "culture",
    label: "Culture & Society",
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: "philosophy",
    label: "Philosophy",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    id: "writing",
    label: "Writing & Literature",
    icon: <PenLine className="w-4 h-4" />,
  },

  // --- Professional & Career Development ---
  {
    id: "career",
    label: "Career Development",
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    id: "entrepreneurship",
    label: "Entrepreneurship",
    icon: <Wallet className="w-4 h-4" />,
  },
  {
    id: "economics",
    label: "Economics",
    icon: <ChartLine className="w-4 h-4" />,
  },
  { id: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" /> },

  // --- Media & Creativity ---
  {
    id: "photography",
    label: "Photography",
    icon: <Camera className="w-4 h-4" />,
  },
  {
    id: "design",
    label: "Design & UI/UX",
    icon: <Palette className="w-4 h-4" />,
  },
  { id: "film", label: "Film & Media", icon: <Video className="w-4 h-4" /> },
  { id: "gaming", label: "Gaming", icon: <Gamepad2 className="w-4 h-4" /> },

  // --- Tech-Specific ---
  {
    id: "programming",
    label: "Programming",
    icon: <Code className="w-4 h-4" />,
  },
  {
    id: "ai",
    label: "Artificial Intelligence",
    icon: <Cpu className="w-4 h-4" />,
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: "mobile-dev",
    label: "Mobile Development",
    icon: <Smartphone className="w-4 h-4" />,
  },
  {
    id: "data-science",
    label: "Data Science",
    icon: <Database className="w-4 h-4" />,
  },
  {
    id: "cloud",
    label: "Cloud Computing",
    icon: <Cloud className="w-4 h-4" />,
  },

  // --- Lifestyle & Personal Interests ---
  { id: "travel", label: "Travel", icon: <Globe className="w-4 h-4" /> },
  {
    id: "sports",
    label: "Sports & Fitness",
    icon: <Dumbbell className="w-4 h-4" />,
  },
  {
    id: "environment",
    label: "Environment",
    icon: <Leaf className="w-4 h-4" />,
  },
  {
    id: "innovation",
    label: "Innovation",
    icon: <Rocket className="w-4 h-4" />,
  },
];
