import { Category } from '@/constants/Categories';
import { NoteColor } from '@/constants/Colors';

export interface TextStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  list: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  category: Category;
  images: string[];
  textStyle: TextStyle;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface NoteFormData {
  title: string;
  content: string;
  color: NoteColor;
  category: Category;
  images: string[];
  textStyle: TextStyle;
}