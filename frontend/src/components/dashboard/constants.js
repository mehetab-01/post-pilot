import { FaXTwitter, FaLinkedinIn, FaRedditAlien, FaInstagram, FaWhatsapp } from 'react-icons/fa6'
import {
  Briefcase, Coffee, Flame, BookOpen, GraduationCap, Smile, Sparkles, Target,
} from 'lucide-react'

export const PLATFORMS = [
  {
    id:    'twitter',
    label: 'X / Twitter',
    Icon:  FaXTwitter,
    color: '#e7e7e7',
    rgb:   '231,231,231',
    limit: 280,
    desc:  '280 chars',
  },
  {
    id:    'linkedin',
    label: 'LinkedIn',
    Icon:  FaLinkedinIn,
    color: '#0a66c2',
    rgb:   '10,102,194',
    limit: 3000,
    desc:  '3 000 chars',
  },
  {
    id:    'reddit',
    label: 'Reddit',
    Icon:  FaRedditAlien,
    color: '#ff4500',
    rgb:   '255,69,0',
    limit: 40000,
    desc:  'title + body',
  },
  {
    id:    'instagram',
    label: 'Instagram',
    Icon:  FaInstagram,
    color: '#e1306c',
    rgb:   '225,48,108',
    limit: 2200,
    desc:  '2 200 chars',
  },
  {
    id:    'whatsapp',
    label: 'WhatsApp',
    Icon:  FaWhatsapp,
    color: '#25d366',
    rgb:   '37,211,102',
    limit: 1000,
    desc:  'short & personal',
  },
]

export const TONES = [
  {
    id:          'professional',
    label:       'Professional',
    Icon:        Briefcase,
    description: 'Formal and authoritative, with warmth',
    example:     "Excited to announce that after 2 years of dedicated work, I've been promoted to…",
  },
  {
    id:          'casual',
    label:       'Casual',
    Icon:        Coffee,
    description: 'Relaxed and conversational',
    example:     "So this happened today and I'm still processing it lol…",
  },
  {
    id:          'hype',
    label:       'Hype',
    Icon:        Flame,
    description: 'High energy and celebratory',
    example:     "WE DID IT. After mass rejections, mass emailed 200 companies, and landed THE dream role…",
  },
  {
    id:          'storytelling',
    label:       'Storytelling',
    Icon:        BookOpen,
    description: 'Narrative arc with a hook and lesson',
    example:     "6 months ago I mass emailed 200 companies. Every single one said no. Here's what happened next…",
  },
  {
    id:          'educational',
    label:       'Educational',
    Icon:        GraduationCap,
    description: 'Teaching tone with actionable tips',
    example:     "5 things I wish someone told me before my first software engineering interview…",
  },
  {
    id:          'witty',
    label:       'Witty',
    Icon:        Smile,
    description: 'Clever humor and wordplay',
    example:     "My code finally compiled on the first try. Naturally, I mass emailed all my ex's to share the good news.",
  },
  {
    id:          'inspirational',
    label:       'Inspirational',
    Icon:        Sparkles,
    description: 'Motivational and uplifting',
    example:     "If someone who mass emailed companies 200 times before getting a yes can make it — trust me, so can you.",
  },
  {
    id:          'bold',
    label:       'Bold',
    Icon:        Target,
    description: 'Hot takes and strong opinions',
    example:     "Unpopular opinion: you don't need a CS degree to be a great developer. Here's why…",
  },
]

export const DEFAULT_TONE = 'professional'
export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]))
export const TONE_MAP     = Object.fromEntries(TONES.map((t) => [t.id, t]))
