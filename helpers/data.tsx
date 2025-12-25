import { Target, Heart, Code, BookOpen, Music, Camera } from "lucide-react";
import { MdAgriculture, MdGrass } from "react-icons/md";

export const AVAILABLE_INTERESTS = [
  { id: "tech", label: "Technology", icon: <Code className="w-4 h-4" /> },
  { id: "art", label: "Digital Art", icon: <Camera className="w-4 h-4" /> },
  {
    id: "business",
    label: "SaaS & Startups",
    icon: <Target className="w-4 h-4" />,
  },
  {
    id: "edu",
    label: "Learning/Education",
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
];
