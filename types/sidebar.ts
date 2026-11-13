export type NavItem = {
  segment: string;
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: NavItem[];
  onlyAdmin: boolean;
};

export type NavHeader = {
  kind: "header";
  title: string;
  onlyAdmin: boolean;
};

export type NavDivider = {
  kind: "divider";
  onlyAdmin: boolean;
};

export type NavItemType = NavItem | NavHeader | NavDivider;
