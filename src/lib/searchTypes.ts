export interface PageSearchEntry {
  section: string;
  text: string;
  /** Override route if the entry points to a sub-section (e.g. query param) */
  route?: string;
}

export interface ContentEntry {
  id: string;
  page: string;
  route: string;
  section: string;
  text: string;
}
