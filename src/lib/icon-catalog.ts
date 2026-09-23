/**
 * ডকুমেন্টে ব্যবহারযোগ্য আইকন ক্যাটালগ — Lucide আইকন + বাংলা ক্যাটাগরি/সার্চ।
 *
 * - এডিটরের NodeView সরাসরি Lucide React কম্পোনেন্ট রেন্ডার করে
 * - স্টোরেজ/প্রিন্ট/এক্সপোর্টের জন্য renderToStaticMarkup দিয়ে ইনলাইন SVG মার্কআপ
 * - "অলংকার চিহ্ন" (ornament characters) টেক্সট হিসেবে বসে — সব ফন্টে চলে
 */

import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LucideProps } from 'lucide-react';
import {
  // শিক্ষা
  Atom, Award, BadgeCheck, Book, BookA, BookMarked, BookOpen, BookmarkCheck,
  Calculator, ClipboardCheck, ClipboardList, FlaskConical, GraduationCap, Languages,
  Library, Medal, Microscope, Notebook, NotebookPen, Palette, PencilRuler, Pi,
  Ruler, Scroll, ScrollText, Shapes, Sigma, SpellCheck, Telescope, TestTube, Trophy,
  // প্রতীক
  Asterisk, Bookmark, Check, CheckCheck, CircleAlert, CircleCheck, CircleHelp,
  Copyright, Crown, Flag, Flame, Hash, Heart, Infinity as InfinityIcon,
  Info, Lightbulb, Megaphone, Minus, Percent, Pin, Plus, Quote, Sparkle,
  Sparkles, Star, Tag, ThumbsDown, ThumbsUp, TriangleAlert, X, Zap,
  // তীর ও দিক
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowDownRight, ArrowUpRight, ChevronDown,
  ChevronLeft, ChevronRight, ChevronUp, CircleArrowRight, CornerDownLeft, CornerDownRight,
  CornerUpLeft, MoveDownLeft, MoveDownRight, MoveUpLeft, MoveUpRight, MousePointerClick,
  Redo2, Repeat, Repeat2, RefreshCcw, RefreshCw, RotateCcw, RotateCw, Shuffle, Split,
  TrendingDown, TrendingUp, Undo2,
  // বস্তু ও অফিস
  Archive, AlarmClock, Banknote, Bell, BellRing, Briefcase, Building, Building2, Calendar,
  CalendarCheck, CalendarDays, Camera, Clock, Coins, CreditCard, Eraser, Factory, FileImage,
  FilePlus2, FileText, Files, Folder, FolderOpen, Gift, Gavel, Globe, Highlighter,
  Home, Hourglass, Key, KeyRound, Landmark, Lock, LockOpen, Mail, MailOpen, Map as MapIcon,
  MapPin, Paintbrush, PaintBucket, Paperclip, Pen, PenLine, PenTool, Phone, PiggyBank,
  Printer, Receipt, Scale, Scissors, Send, ShoppingBag, Compass, Stamp, Store, Umbrella,
  Wallet, Watch,
  // প্রকৃতি
  Bird, Bug, Cat, Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, CloudSun,
  Dog, Droplet, Droplets, Earth, Fish, Flower, Flower2, Leaf, Moon, MoonStar, Mountain,
  MountainSnow, Rainbow, Rabbit, Snowflake, Sprout, Squirrel, Sun, Sunrise,
  Sunset, TreeDeciduous, TreePalm, TreePine, Turtle, Waves, Wind,
  // মানুষ ও আবেগ
  Accessibility, Angry, Annoyed, Baby, Bone, Brain, Ear, Eye, Frown, Hand, Handshake,
  HeartHandshake, HeartPulse, Laugh, Meh, PersonStanding, Pill, Smile, Stethoscope,
  Syringe, User, UserCheck, UserPlus, UserRound, Users,
  // খাবার
  Apple, Banana, Beer, Cake, CakeSlice, Candy, Carrot, Cherry, Cookie, Coffee, Croissant,
  CupSoda, Drumstick, Egg, FishSymbol, GlassWater, Grape, IceCreamBowl, IceCreamCone,
  Milk, Pizza, Popcorn, Sandwich, Utensils, UtensilsCrossed, Wheat, Wine,
  // প্রযুক্তি
  Battery, BatteryCharging, Bot, Braces, Cable, Cog, Code, Computer, Cpu, Database, Download,
  Gamepad2, HardDrive, Headphones, Headset, Keyboard, Laptop, Mic, MicOff, Monitor, Mouse, Plug,
  PlugZap, Power, Radio, Router, Search, Server, Settings, Settings2, Smartphone, Speaker,
  Tablet, Terminal, Tv, Upload, Usb, Wifi, WifiOff,
  // যাতায়াত ও স্থান
  Ambulance, Bike, Bus, BusFront, Car, CarFront, Hotel, Hospital,
  Plane, PlaneLanding, PlaneTakeoff, Rocket, Sailboat, School, Ship, Siren,
  Tractor, TramFront, TrainFront, Truck,
  // খেলা ও বিনোদন
  Dices, Dumbbell, FlagTriangleLeft, FlagTriangleRight, Gauge, Music, Music2, Music3, Music4,
  Puzzle, Sword, Target, Timer, Volleyball,
} from 'lucide-react';

type LucideIcon = ComponentType<LucideProps>;

export interface IconEntry {
  /** Lucide কম্পোনেন্টের নাম — স্টোরেজ আইডি হিসেবেও ব্যবহৃত */
  name: string;
  Icon: LucideIcon;
  /** বাংলা/ইংরেজি সার্চ কীওয়ার্ড */
  kw: string;
}

export interface IconCategory {
  id: string;
  label: string;
  icons: IconEntry[];
}

const E = (name: string, Icon: LucideIcon, kw = ''): IconEntry => ({ name, Icon, kw });

/** ═══ ক্যাটাগরি-ভিত্তিক ক্যাটালগ ═══ */
export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'edu',
    label: 'শিক্ষা',
    icons: [
      E('GraduationCap', GraduationCap, 'গ্র্যাজুয়েশন টুপি ছাত্র শিক্ষার্থী'),
      E('BookOpen', BookOpen, 'বই পড়া খোলা'),
      E('Book', Book, 'বই'),
      E('BookMarked', BookMarked, 'বই চিহ্নিত'),
      E('BookA', BookA, 'বর্ণমালা শেখা'),
      E('Library', Library, 'লাইব্রেরি পাঠাগার'),
      E('NotebookPen', NotebookPen, 'খাতা নোট লেখা'),
      E('Notebook', Notebook, 'খাতা নোটবুক'),
      E('Pen', Pen, 'কলম পেন'),
      E('PenLine', PenLine, 'লেখা সই'),
      E('PencilRuler', PencilRuler, 'পেন্সিল স্কেল মাপজোক'),
      E('Ruler', Ruler, 'স্কেল মাপ'),
      E('Calculator', Calculator, 'ক্যালকুলেটর গণিত হিসাব'),
      E('Shapes', Shapes, 'গঠন জ্যামিতি আকৃতি'),
      E('Sigma', Sigma, 'যোগফল গাণিতিক'),
      E('Pi', Pi, 'পাই গণিত'),
      E('Percent', Percent, 'শতকরা পার্সেন্ট'),
      E('Atom', Atom, 'পরমাণু বিজ্ঞান'),
      E('FlaskConical', FlaskConical, 'পরীক্ষা রসায়ন ল্যাব'),
      E('TestTube', TestTube, 'টেস্ট টিউব ল্যাব'),
      E('Microscope', Microscope, 'মাইক্রোস্কোপ জীববিজ্ঞান'),
      E('Telescope', Telescope, 'টেলিস্কোপ জ্যোতির্বিজ্ঞান'),
      E('SpellCheck', SpellCheck, 'বানান যাচাই'),
      E('Languages', Languages, 'ভাষা অনুবাদ'),
      E('ScrollText', ScrollText, 'দলিল ঘোষণা'),
      E('Scroll', Scroll, 'স্ক্রল পুরনো লেখা'),
      E('ClipboardList', ClipboardList, 'তালিকা ক্লিপবোর্ড'),
      E('ClipboardCheck', ClipboardCheck, 'উত্তরপত্র পরীক্ষা'),
      E('Award', Award, 'পুরস্কার পদক'),
      E('Medal', Medal, 'পদক মেডেল'),
      E('Trophy', Trophy, 'ট্রফি জয়'),
      E('BadgeCheck', BadgeCheck, 'ভেরিফাইড ব্যাজ'),
    ],
  },
  {
    id: 'sym',
    label: 'প্রতীক ও চিহ্ন',
    icons: [
      E('Star', Star, 'তারা রেটিং ভালো'),
      E('Heart', Heart, 'হৃদয় ভালোবাসা লাইক'),
      E('Sparkles', Sparkles, 'ঝিলিক নতুন আকর্ষণীয়'),
      E('Sparkle', Sparkle, 'ঝিকিমিকি'),
      E('Zap', Zap, 'বিদ্যুৎ দ্রুত শক্তি'),
      E('Flame', Flame, 'আগুন লেখার কলি'),
      E('Lightbulb', Lightbulb, 'বাল্ব আইডিয়া ধারণা'),
      E('Check', Check, 'টিক সঠিক হ্যাঁ'),
      E('CheckCheck', CheckCheck, 'ডাবল টিক সম্পন্ন'),
      E('X', X, 'বাতিল ভুল ক্রস'),
      E('Plus', Plus, 'যোগ প্লাস'),
      E('Minus', Minus, 'বিয়োগ মাইনাস'),
      E('Info', Info, 'তথ্য ইনফো'),
      E('CircleAlert', CircleAlert, 'সতর্কতা সাবধান এলার্ট'),
      E('TriangleAlert', TriangleAlert, 'সতর্কবার্তা বিপদ'),
      E('CircleHelp', CircleHelp, 'প্রশ্ন হেল্প জিজ্ঞাসা'),
      E('Quote', Quote, 'উক্তি উদ্ধৃতি'),
      E('Megaphone', Megaphone, 'মাইক ঘোষণা বিজ্ঞাপন'),
      E('Pin', Pin, 'পিন নোট আটকানো'),
      E('Flag', Flag, 'পতাকা দেশ'),
      E('Crown', Crown, 'মুকুট রাজা প্রথম'),
      E('Bookmark', Bookmark, 'বুকমার্ক চিহ্ন'),
      E('BookmarkCheck', BookmarkCheck, 'বুকমার্ক টিক'),
      E('Tag', Tag, 'ট্যাগ লেবেল দাম'),
      E('Hash', Hash, 'হ্যাশ নম্বর'),
      E('Asterisk', Asterisk, 'তারকচিহ্ন ফুটনোট'),
      E('Infinity', InfinityIcon, 'অসীম ইনফিনিটি'),
      E('Copyright', Copyright, 'কপিরাইট স্বত্ব'),
      E('ThumbsUp', ThumbsUp, 'লাইক ভালো সম্মতি'),
      E('ThumbsDown', ThumbsDown, 'নেতিবাচক অসম্মতি'),
    ],
  },
  {
    id: 'arrow',
    label: 'তীর ও দিকনির্দেশ',
    icons: [
      E('ArrowRight', ArrowRight, 'ডান তীর পরের'),
      E('ArrowLeft', ArrowLeft, 'বাম তীর আগের'),
      E('ArrowUp', ArrowUp, 'উপরে তীর'),
      E('ArrowDown', ArrowDown, 'নিচে তীর'),
      E('ArrowUpRight', ArrowUpRight, 'উপর-ডান তীর বাইরে'),
      E('ArrowDownRight', ArrowDownRight, 'নিচ-ডান তীর'),
      E('ChevronRight', ChevronRight, 'বাঁকা তীর ডান'),
      E('ChevronLeft', ChevronLeft, 'বাঁকা তীর বাম'),
      E('ChevronUp', ChevronUp, 'বাঁকা তীর উপর'),
      E('ChevronDown', ChevronDown, 'বাঁকা তীর নিচ'),
      E('CircleArrowRight', CircleArrowRight, 'গোল তীর এগোনো'),
      E('CornerDownRight', CornerDownRight, 'বাঁক নিচে ডানে'),
      E('CornerDownLeft', CornerDownLeft, 'বাঁক নিচে বামে'),
      E('CornerUpLeft', CornerUpLeft, 'বাঁক উপরে বামে'),
      E('MoveUpRight', MoveUpRight, 'কোণায় উপর ডান'),
      E('MoveDownRight', MoveDownRight, 'কোণায় নিচ ডান'),
      E('MoveUpLeft', MoveUpLeft, 'কোণায় উপর বাম'),
      E('MoveDownLeft', MoveDownLeft, 'কোণায় নিচ বাম'),
      E('TrendingUp', TrendingUp, 'গ্রাফ বৃদ্ধি উন্নতি'),
      E('TrendingDown', TrendingDown, 'গ্রাফ পতন'),
      E('RefreshCw', RefreshCw, 'রিফ্রেশ পুনরায়'),
      E('RefreshCcw', RefreshCcw, 'রিফ্রেশ বিপরীত'),
      E('RotateCw', RotateCw, 'ঘোরাও ডানে'),
      E('RotateCcw', RotateCcw, 'ঘোরাও বামে'),
      E('Repeat', Repeat, 'পুনরাবৃত্তি'),
      E('Repeat2', Repeat2, 'লুপ পুনরাবৃত্তি'),
      E('Undo2', Undo2, 'আনডু ফেরানো'),
      E('Redo2', Redo2, 'রিডু আবার'),
      E('Shuffle', Shuffle, 'এলোমেলো শাফল'),
      E('Split', Split, 'বিভক্ত শাখা'),
      E('MousePointerClick', MousePointerClick, 'ক্লিক চাপুন'),
    ],
  },
  {
    id: 'obj',
    label: 'বস্তু ও অফিস',
    icons: [
      E('Paperclip', Paperclip, 'পেপারক্লিপ সংযুক্তি'),
      E('Scissors', Scissors, 'কাঁচি কাটা'),
      E('Compass', Compass, 'কম্পাস দিক'),
      E('Eraser', Eraser, 'রাবার মুছুন'),
      E('Highlighter', Highlighter, 'হাইলাইটার চিহ্নিত'),
      E('PenTool', PenTool, 'ডিজাইন কলম'),
      E('Paintbrush', Paintbrush, 'পেইন্টব্রাশ আঁকা'),
      E('PaintBucket', PaintBucket, 'রং রঙিন'),
      E('Palette', Palette, 'রঙের পাতে'),
      E('Camera', Camera, 'ক্যামেরা ছবি'),
      E('Printer', Printer, 'প্রিন্টার ছাপা'),
      E('Phone', Phone, 'ফোন যোগাযোগ'),
      E('Mail', Mail, 'চিঠি ইমেইল'),
      E('MailOpen', MailOpen, 'খোলা চিঠি'),
      E('Send', Send, 'পাঠান প্রেরণ'),
      E('MapPin', MapPin, 'লোকেশন ঠিকানা পিন'),
      E('Map', MapIcon, 'ম্যাপ নকশা'),
      E('Globe', Globe, 'পৃথিবী বিশ্ব'),
      E('Earth', Earth, 'পৃথিবী গোলক'),
      E('Clock', Clock, 'ঘড়ি সময়'),
      E('AlarmClock', AlarmClock, 'অ্যালার্ম ঘড়ি'),
      E('Watch', Watch, 'হাতঘড়ি'),
      E('Hourglass', Hourglass, 'বালুঘড়ি সময়'),
      E('Calendar', Calendar, 'ক্যালেন্ডার তারিখ'),
      E('CalendarDays', CalendarDays, 'ক্যালেন্ডার দিন'),
      E('CalendarCheck', CalendarCheck, 'সময়সূচি নিশ্চিত'),
      E('Home', Home, 'বাড়ি ঘর'),
      E('Building', Building, 'ভবন অফিস'),
      E('Building2', Building2, 'অফিস টাওয়ার'),
      E('Factory', Factory, 'কারখানা শিল্প'),
      E('Store', Store, 'দোকান বিক্রয়'),
      E('ShoppingBag', ShoppingBag, 'কেনাকাটা ব্যাগ'),
      E('Receipt', Receipt, 'রসিদ হিসাব'),
      E('School', School, 'স্কুল বিদ্যালয়'),
      E('Hospital', Hospital, 'হাসপাতাল চিকিৎসা'),
      E('Hotel', Hotel, 'হোটেল থাকা'),
      E('Briefcase', Briefcase, 'ব্রিফকেস চাকরি কাজ'),
      E('Folder', Folder, 'ফোল্ডার'),
      E('FolderOpen', FolderOpen, 'খোলা ফোল্ডার'),
      E('FileText', FileText, 'ডকুমেন্ট ফাইল'),
      E('FileImage', FileImage, 'ছবির ফাইল'),
      E('FilePlus2', FilePlus2, 'নতুন ফাইল'),
      E('Files', Files, 'একাধিক ফাইল'),
      E('Archive', Archive, 'আর্কাইভ সংরক্ষণ'),
      E('Stamp', Stamp, 'সিলমোহর স্ট্যাম্প'),
      E('Scale', Scale, 'ন্যায়পাল দাঁড়িপাল্লা'),
      E('Gavel', Gavel, 'বিচারক হাতুড়ি'),
      E('Landmark', Landmark, 'ব্যাংক স্মৃতিস্তম্ভ'),
      E('Gift', Gift, 'উপহার উপহারসামগ্রী'),

      E('CreditCard', CreditCard, 'কার্ড পেমেন্ট'),
      E('Wallet', Wallet, 'মানিব্যাগ'),
      E('Banknote', Banknote, 'নোট টাকা টাকার নোট'),
      E('Coins', Coins, 'কয়েন মুদ্রা'),
      E('PiggyBank', PiggyBank, 'সঞ্চয় মাছি ব্যাংক'),
      E('Key', Key, 'চাবি কী'),
      E('KeyRound', KeyRound, 'গোল চাবি'),
      E('Lock', Lock, 'তালা লক'),
      E('LockOpen', LockOpen, 'খোলা তালা'),
      E('Bell', Bell, 'ঘণ্টা বিজ্ঞপ্তি'),
      E('BellRing', BellRing, 'ঘণ্টা বাজছে'),
      E('Umbrella', Umbrella, 'ছাতা বৃষ্টি'),
    ],
  },
  {
    id: 'nature',
    label: 'প্রকৃতি ও আবহাওয়া',
    icons: [
      E('Sun', Sun, 'সূর্য গরম দিন'),
      E('Sunrise', Sunrise, 'সূর্যোদয় ভোর'),
      E('Sunset', Sunset, 'সূর্যাস্ত সন্ধ্যা'),
      E('Moon', Moon, 'চাঁদ রাত'),
      E('MoonStar', MoonStar, 'চাঁদ-তারা রাত ইসলামি'),
      E('Cloud', Cloud, 'মেঘ'),
      E('CloudSun', CloudSun, 'মেঘ-সূর্য আংশিক'),
      E('CloudRain', CloudRain, 'বৃষ্টি মেঘ'),
      E('CloudDrizzle', CloudDrizzle, 'গুঁড়ি বৃষ্টি'),
      E('CloudSnow', CloudSnow, 'তুষার বরফ'),
      E('CloudLightning', CloudLightning, 'বজ্র বিদ্যুৎ'),
      E('Snowflake', Snowflake, 'তুষারকণা শীত'),
      E('Wind', Wind, 'বাতাস হাওয়া'),
      E('Waves', Waves, 'ঢেউ সমুদ্র পানি'),
      E('Droplet', Droplet, 'ফোঁটা পানি'),
      E('Droplets', Droplets, 'ফোঁটা বৃষ্টি পানি'),
      E('Rainbow', Rainbow, 'রংধনু রং'),
      E('TreePine', TreePine, 'পাইন গাছ অরণ্য'),
      E('TreeDeciduous', TreeDeciduous, 'গাছ বৃক্ষ'),
      E('TreePalm', TreePalm, 'তালগাছ নারকেল'),
      E('Leaf', Leaf, 'পাতা সবুজ'),
      E('Flower', Flower, 'ফুল পুষ্প'),
      E('Flower2', Flower2, 'ফুল ডালে'),
      E('Sprout', Sprout, 'চারা অঙ্কুর'),
      E('Mountain', Mountain, 'পাহাড় পর্বত'),
      E('MountainSnow', MountainSnow, 'বরফ পাহাড় হিমালয়'),
      E('Bird', Bird, 'পাখি পাখি'),
      E('Fish', Fish, 'মাছ'),
      E('FishSymbol', FishSymbol, 'মাছ চিহ্ন'),
      E('Bug', Bug, 'পোকা ইনসেক্ট'),
      E('Cat', Cat, 'বিড়াল'),
      E('Dog', Dog, 'কুকুর'),
      E('Rabbit', Rabbit, 'খরগোশ'),
      E('Squirrel', Squirrel, 'কাঠবিড়ালি'),
      E('Turtle', Turtle, 'কচ্ছপ'),
    ],
  },
  {
    id: 'people',
    label: 'মানুষ ও আবেগ',
    icons: [
      E('User', User, 'ব্যক্তি ইউজার মানুষ'),
      E('UserRound', UserRound, 'ব্যক্তি প্রোফাইল'),
      E('Users', Users, 'গ্রুপ দল জনগণ'),
      E('UserCheck', UserCheck, 'সদস্য নিশ্চিত'),
      E('UserPlus', UserPlus, 'নতুন সদস্য যোগ'),
      E('Baby', Baby, 'শিশু শিশু'),
      E('PersonStanding', PersonStanding, 'দাঁড়ানো মানুষ'),
      E('Accessibility', Accessibility, 'প্রতিবন্ধী অ্যাক্সেস'),
      E('Hand', Hand, 'হাত শান্তি'),
      E('Handshake', Handshake, 'হাত মেলানো চুক্তি'),
      E('HeartHandshake', HeartHandshake, 'সহযোগিতা দয়া'),
      E('Smile', Smile, 'হাসি খুশি'),
      E('Laugh', Laugh, 'হাসি আনন্দ'),
      E('Meh', Meh, 'নিরপেক্ষ অনুভূতি'),
      E('Frown', Frown, 'মুখ ভার দুঃখ'),
      E('Annoyed', Annoyed, 'বিরক্তি'),
      E('Angry', Angry, 'রাগ ক্রোধ'),
      E('Eye', Eye, 'চোখ দেখা'),
      E('Ear', Ear, 'কান শোনা'),
      E('Brain', Brain, 'মস্তিষ্ক বুদ্ধি'),
      E('HeartPulse', HeartPulse, 'স্বাস্থ্য হৃৎস্পন্দন'),
      E('Stethoscope', Stethoscope, 'স্টেথোস্কোপ ডাক্তার'),
      E('Pill', Pill, 'ঔষধ ওষুধ'),
      E('Syringe', Syringe, 'সুই টিকা'),
      E('Bone', Bone, 'হাড়'),
    ],
  },
  {
    id: 'food',
    label: 'খাবার ও পানীয়',
    icons: [
      E('Coffee', Coffee, 'কফি চা কাপ'),
      E('CupSoda', CupSoda, 'কোল্ড ড্রিংকস সোডা'),
      E('GlassWater', GlassWater, 'পানি গ্লাস'),
      E('Milk', Milk, 'দুধ'),
      E('Wine', Wine, 'ওয়াইন গ্লাস'),
      E('Beer', Beer, 'পেয়ার মগ'),
      E('Utensils', Utensils, 'খাবার চামচ কাঁটা'),
      E('UtensilsCrossed', UtensilsCrossed, 'রেস্টুরেন্ট খাওয়া'),
      E('Pizza', Pizza, 'পিজা'),
      E('Sandwich', Sandwich, 'স্যান্ডউইচ'),
      E('Apple', Apple, 'আপেল ফল'),
      E('Banana', Banana, 'কলা'),
      E('Cherry', Cherry, 'চেরি ফল'),
      E('Grape', Grape, 'আঙুর'),
      E('Carrot', Carrot, 'গাজর সবজি'),
      E('Egg', Egg, 'ডিম'),
      E('Wheat', Wheat, 'গম ধান ফসল'),
      E('Cake', Cake, 'কেক জন্মদিন'),
      E('CakeSlice', CakeSlice, 'কেকের টুকরো'),
      E('Candy', Candy, 'চকলেট মিষ্টি'),
      E('Cookie', Cookie, 'কুকিজ বিস্কুট'),
      E('IceCreamCone', IceCreamCone, 'আইসক্রিম কোন'),
      E('IceCreamBowl', IceCreamBowl, 'আইসক্রিম বাটি'),
      E('Croissant', Croissant, 'ক্রোয়াঁসোঁ রুটি'),
      E('Popcorn', Popcorn, 'পপকর্ন সিনেমা'),
      E('Drumstick', Drumstick, 'মুরগির মাংস'),
    ],
  },
  {
    id: 'tech',
    label: 'প্রযুক্তি',
    icons: [
      E('Computer', Computer, 'কম্পিউটার পিসি'),
      E('Laptop', Laptop, 'ল্যাপটপ'),
      E('Monitor', Monitor, 'মনিটর ডিসপ্লে'),
      E('Smartphone', Smartphone, 'মোবাইল ফোন'),
      E('Tablet', Tablet, 'ট্যাবলেট'),
      E('Tv', Tv, 'টেলিভিশন'),
      E('Wifi', Wifi, 'ইন্টারনেট ওয়াইফাই সংযোগ'),
      E('WifiOff', WifiOff, 'ইন্টারনেট বন্ধ'),
      E('Battery', Battery, 'ব্যাটারি চার্জ'),
      E('BatteryCharging', BatteryCharging, 'চার্জ হচ্ছে'),
      E('Power', Power, 'পাওয়ার চালু'),
      E('Search', Search, 'খোঁজ সার্চ'),
      E('Settings', Settings, 'সেটিংস সেটআপ'),
      E('Settings2', Settings2, 'কনফিগ টিউন'),
      E('Cog', Cog, 'গিয়ার ইঞ্জিন'),
      E('Cpu', Cpu, 'প্রসেসর চিপ'),
      E('HardDrive', HardDrive, 'হার্ডডিস্ক ড্রাইভ স্টোরেজ'),
      E('Database', Database, 'ডেটাবেস তথ্যভান্ডার'),
      E('Server', Server, 'সার্ভার'),
      E('Code', Code, 'কোড প্রোগ্রাম'),
      E('Braces', Braces, 'ব্রেস সিনট্যাক্স'),
      E('Terminal', Terminal, 'টার্মিনাল কমান্ড'),
      E('Bot', Bot, 'রোবট এআই'),
      E('Radio', Radio, 'রেডিও'),
      E('Router', Router, 'রাউটার নেটওয়ার্ক'),
      E('Headphones', Headphones, 'হেডফোন গান'),
      E('Headset', Headset, 'হেডসেট কল'),
      E('Speaker', Speaker, 'স্পিকার শব্দ'),
      E('Mic', Mic, 'মাইক মাইক্রোফোন'),
      E('MicOff', MicOff, 'মাইক বন্ধ'),
      E('Mouse', Mouse, 'মাউস'),
      E('Keyboard', Keyboard, 'কীবোর্ড টাইপ'),
      E('Cable', Cable, 'তার ক্যাবল'),
      E('Plug', Plug, 'প্লাগ বিদ্যুৎ'),
      E('PlugZap', PlugZap, 'চার্জার'),
      E('Usb', Usb, 'ইউএসবি পেনড্রাইভ'),
      E('Download', Download, 'ডাউনলোড নামাও'),
      E('Upload', Upload, 'আপলোড উঠাও'),
    ],
  },
  {
    id: 'travel',
    label: 'যাতায়াত ও স্থান',
    icons: [
      E('Car', Car, 'গাড়ি কার'),
      E('CarFront', CarFront, 'গাড়ি সামনে'),
      E('Bus', Bus, 'বাস'),
      E('BusFront', BusFront, 'বাস সামনে'),
      E('Truck', Truck, 'ট্রাক মালবাহী'),
      E('Ambulance', Ambulance, 'অ্যাম্বুলেন্স জরুরি'),
      E('Siren', Siren, 'সাইরেন জরুরি ফায়ার সার্ভিস'),
      E('Bike', Bike, 'সাইকেল সাইকেল'),
      E('Plane', Plane, 'বিমান উড়োজাহাজ'),
      E('PlaneTakeoff', PlaneTakeoff, 'উড্ডয়ন যাত্রা'),
      E('PlaneLanding', PlaneLanding, 'অবতরণ'),
      E('Tractor', Tractor, 'ট্রাক্টর কৃষি'),
      E('Ship', Ship, 'জাহাজ নৌকা'),
      E('Sailboat', Sailboat, 'পালতোলা নৌকা'),
      E('TrainFront', TrainFront, 'ট্রেন রেলগাড়ি'),
      E('TramFront', TramFront, 'ট্রাম'),
      E('Rocket', Rocket, 'রকেট উৎক্ষেপণ'),
    ],
  },
  {
    id: 'play',
    label: 'খেলাধুলা ও সংগীত',
    icons: [
      E('Timer', Timer, 'টাইমার সময় মাপা'),
      E('Target', Target, 'লক্ষ্য টার্গেট'),
      E('Gauge', Gauge, 'গতি মাপক যন্ত্র'),
      E('Dumbbell', Dumbbell, 'ডাম্বেল ব্যায়াম শরীরচর্চা'),
      E('Volleyball', Volleyball, 'ভলিবল খেলা'),
      E('Dices', Dices, 'ছক্কা খেলা পাশা'),
      E('FlagTriangleRight', FlagTriangleRight, 'মার্কার পতাকা'),
      E('FlagTriangleLeft', FlagTriangleLeft, 'মার্কার পতাকা বাম'),
      E('Puzzle', Puzzle, 'পাজল ধাঁধা'),
      E('Gamepad2', Gamepad2, 'গেম খেলা'),
      E('Sword', Sword, 'তলোয়ার যুদ্ধ'),
      E('Music', Music, 'সংগীত নোট'),
      E('Music2', Music2, 'সুর গান'),
      E('Music3', Music3, 'সুর বাদ্য'),
      E('Music4', Music4, 'সংগীত চিহ্ন'),
    ],
  },
];

/** নাম → এন্ট্রি ম্যাপ */
export const ICON_BY_NAME = new Map<string, IconEntry>();
for (const cat of ICON_CATEGORIES) {
  for (const entry of cat.icons) {
    if (!ICON_BY_NAME.has(entry.name)) ICON_BY_NAME.set(entry.name, entry);
  }
}

/** সব আইকনের সমতল তালিকা (সার্চে ব্যবহৃত) */
export const ALL_ICONS: IconEntry[] = ICON_CATEGORIES.flatMap((c) => c.icons);

/** অলংকার চিহ্ন — টেক্সট অক্ষর হিসেবে বসে, সব প্রিন্টে নিরাপদ */
export const ORNAMENTS: Array<{ char: string; label: string }> = [
  { char: '❦', label: 'ফ্লোরিশ' },
  { char: '❧', label: 'ফ্লোরিশ ডান' },
  { char: '❖', label: 'ডায়মন্ড' },
  { char: '✦', label: 'চার-কোণ তারা' },
  { char: '✧', label: 'ফাঁপা তারা' },
  { char: '✩', label: 'ফাঁপা তারা দুই' },
  { char: '✪', label: 'গোল তারা' },
  { char: '✯', label: 'উজ্জ্বল তারা' },
  { char: '✿', label: 'ফুল' },
  { char: '❀', label: 'ফাঁপা ফুল' },
  { char: '❁', label: 'ফুল দুই' },
  { char: '❈', label: 'তারাকা ফুল' },
  { char: '❉', label: 'তারাকা' },
  { char: '❋', label: 'তারাকা তিন' },
  { char: '❄', label: 'তুষারকণা' },
  { char: '☙', label: 'ফ্লোরিশ বাম' },
  { char: '❣', label: 'হৃদয় এক্সক্লেম' },
  { char: '♥', label: 'হৃদয় কালো' },
  { char: '♦', label: 'ডায়মন্ড কালো' },
  { char: '♣', label: 'ক্লাব' },
  { char: '♠', label: 'স্পেড' },
  { char: '༄', label: 'তিব্বতি অলংকার' },
  { char: 'ༀ', label: 'ওঁ' },
  { char: '☯', label: 'ইয়িং-ইয়াং' },
  { char: '⚘', label: 'ফুলডালা' },
  { char: '☘', label: 'ক্লোভার' },
  { char: '♪', label: 'সংগীত নোট' },
  { char: '♫', label: 'সংগীত নোট জোড়া' },
  { char: '♬', label: 'সংগীত তিন' },
  { char: '✂', label: 'কাঁচি (কাট-লাইন)' },
  { char: '☎', label: 'টেলিফোন' },
  { char: '✉', label: 'চিঠি' },
  { char: '☀', label: 'রোদ' },
  { char: '☁', label: 'মেঘ' },
  { char: '☂', label: 'ছাতা' },
  { char: '⚑', label: 'পতাকা' },
  { char: '☞', label: 'নির্দেশক হাত ডান' },
  { char: '☜', label: 'নির্দেশক হাত বাম' },
];

/** ═══ সাম্প্রতিক ব্যবহৃত আইকন (localStorage) ═══ */
const RECENT_KEY = 'bwp-recent-icons-v1';

export function getRecentIcons(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((n): n is string => typeof n === 'string' && ICON_BY_NAME.has(n)).slice(0, 16);
  } catch {
    return [];
  }
}

export function pushRecentIcon(name: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const next = [name, ...getRecentIcons().filter((n) => n !== name)].slice(0, 16);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* উপেক্ষা */ }
}

/** ═══ আইকন → ইনলাইন SVG মার্কআপ (প্রিন্ট/এক্সপোর্ট নিরাপদ) ═══ */

const FALLBACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="7"/></svg>';

const markupCache = new Map<string, string>();

/**
 * আইকনের ন্যূনতম SVG মার্কআপ (24×24 viewBox, stroke=currentColor, width/height ছাড়া)।
 * ফলাফল ক্যাশ হয় — বারবার কল সস্তা।
 */
export function getIconSvgMarkup(name: string): string {
  const cached = markupCache.get(name);
  if (cached !== undefined) return cached;

  let markup = '';
  const entry = ICON_BY_NAME.get(name);
  if (entry) {
    try {
      markup = renderToStaticMarkup(createElement(entry.Icon, { size: 24, strokeWidth: 2, absoluteStrokeWidth: false }));
    } catch { /* ফলব্যাকে যাবে */ }
  }
  if (!markup || !markup.includes('<svg')) markup = FALLBACK_SVG;

  // width/height সরিয়ে CSS-নিয়ন্ত্রিত করা — যেকোনো সাইজে স্কেল হয়
  markup = markup.replace(/\swidth="24"/, '').replace(/\sheight="24"/, '');

  markupCache.set(name, markup);
  return markup;
}

/** সার্চ — নাম + কীওয়ার্ডে ম্যাচ (কেস-অসংবেদনশীল) */
export function searchIcons(query: string): { categories: Array<{ id: string; label: string; icons: IconEntry[] }>; total: number } {
  const q = query.trim().toLowerCase();
  if (!q) return { categories: ICON_CATEGORIES, total: ALL_ICONS.length };
  const categories: Array<{ id: string; label: string; icons: IconEntry[] }> = [];
  let total = 0;
  for (const cat of ICON_CATEGORIES) {
    const icons = cat.icons.filter(
      (e) => e.name.toLowerCase().includes(q) || e.kw.includes(q) || e.kw.toLowerCase().includes(q),
    );
    if (icons.length) {
      categories.push({ id: cat.id, label: cat.label, icons });
      total += icons.length;
    }
  }
  return { categories, total };
}
