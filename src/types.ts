export type ListDocItem = {
  id: string;
  name: string;
  owners?: { emailAddress?: string }[];
  modifiedTime?: string;
};