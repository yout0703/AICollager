export interface Nav {
  title: string;
  name?: string;
  url?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  icon?: string;
  disabled?: boolean;
  children?: Nav[];
}
