// Shape of object returned from GitHub API for getting a Gist.
interface Gist {
  url: string;
  forks_url: string;
  commits_url: string;
  id: string;
  node_id: string;
  git_pull_url: string;
  git_push_url: string;
  html_url: string;
  files: GistFile[];
  public: boolean;
  created_at: Date;
  updated_at: Date;
  description: string;
  comments: number;
  user: string | null;
  comments_url: string;
  owner: GistOwner;
  // eslint-disable-next-line
  forks: any[]; // IDK WHAT THIS RETURNS
  history: GistHistory[];
}

// Shape of object returned from GitHub API for a file that is part of a Gist.
interface GistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
  truncated: boolean;
  content: string;
}

interface GistOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
}

interface GistHistory {
  user: GistOwner;
  version: string;
  committed_at: Date;
  change_status: GistChangeStatus;
  url: string;
}

interface GistChangeStatus {
  total: number;
  additions: number;
  deletions: number;
}

interface FilesObject {
  [fileName: string]: { content: string };
}
