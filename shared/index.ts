// https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
export type PrivateGithubUser = {
    login: string;
    id: number;
    node_id: string;
    gravatar_id: string | null;
    type: string;
    site_admin: boolean;
    name: string;
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    hireable: boolean | null;
    bio: string | null;
    twitter_username: string | null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string; // date-time
    updated_at: string; // date-time
    private_gists: number;
    total_private_repos: number;
    owned_private_repos: number;
    disk_usage: number;
    collaborators: number;
    two_factor_authentication: boolean;
    plan: {
        collaborators: number;
        name: string;
        space: number;
        private_repos: number;
    };
    suspended_at: string | null; // date-time
    business_plus: boolean;
    ldap_dn: string;

    avatar_url: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
};
export type PublicGithubUser = Pick<
    PrivateGithubUser,
    | "login"
    | "id"
    | "node_id"
    | "gravatar_id"
    | "type"
    | "site_admin"
    | "name"
    | "company"
    | "blog"
    | "location"
    | "email"
    | "hireable"
    | "bio"
    | "twitter_username"
    | "public_repos"
    | "public_gists"
    | "followers"
    | "following"
    | "created_at"
    | "updated_at"
    | "plan"
    | "suspended_at"
    | "private_gists"
    | "total_private_repos"
    | "owned_private_repos"
    | "disk_usage"
    | "collaborators"
    // url
    | "avatar_url"
    | "url"
    | "html_url"
    | "followers_url"
    | "following_url"
    | "gists_url"
    | "starred_url"
    | "subscriptions_url"
    | "organizations_url"
    | "repos_url"
    | "events_url"
    | "received_events_url"
>;

export type User = PublicGithubUser & {
    friends: string[]; // github logins
    friendInvitations: string[]; // github logins
};

export type BackendErrorResponse = {
    message: string | null;
};

export type WebsocketMessage =
    | {
          event: "invited_by";
          login: string; // login
      }
    | {
          event: "rejected_by";
          login: string; // login
      }
    | {
          event: "accepted_by";
          login: string;
      };
