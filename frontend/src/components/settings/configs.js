import { FaXTwitter, FaLinkedinIn, FaRedditAlien, FaInstagram, FaWhatsapp } from 'react-icons/fa6'

/**
 * Social platform configs.
 * Claude AI has been moved to the AiProviders section (supports multiple providers).
 *
 * oauthType: true  → renders OAuthConnect button instead of key inputs
 * infoOnly:  true  → renders an info card (clipboard/share flow)
 */
export const PLATFORM_CONFIGS = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    Icon: FaXTwitter,
    color: '#e7e7e7',
    rgb: '231,231,231',
    desc: 'Post tweets and threads directly',
    required: false,
    infoOnly: false,
    oauthType: false,
    keys: [
      { name: 'api_key',             label: 'API Key (Consumer Key)',       placeholder: 'Your consumer key' },
      { name: 'api_secret',          label: 'API Secret (Consumer Secret)', placeholder: 'Your consumer secret' },
      { name: 'access_token',        label: 'Access Token',                 placeholder: 'Your access token' },
      { name: 'access_token_secret', label: 'Access Token Secret',          placeholder: 'Your access token secret' },
    ],
    helperText: null,
    helperLink: null,
    guide: [
      { text: 'Go to', link: { text: 'developer.x.com', url: 'https://developer.x.com' } },
      { text: 'Sign up for a developer account (Basic plan required for write access)' },
      { text: 'Create a new Project and App' },
      { text: 'Enable OAuth 1.0a with Read & Write permissions' },
      { text: 'Go to the Keys and Tokens tab and generate all 4 keys' },
    ],
    note: 'X/Twitter requires a paid Basic developer plan ($100/month) for posting.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    Icon: FaLinkedinIn,
    color: '#0a66c2',
    rgb: '10,102,194',
    desc: 'Share professional updates to your network',
    required: false,
    infoOnly: false,
    oauthType: true,  // ← uses OAuth Connect flow
    keys: [],
    helperText: null,
    helperLink: null,
    guide: null,
    note: 'LinkedIn access tokens expire after ~60 days — you will need to reconnect periodically.',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    Icon: FaRedditAlien,
    color: '#ff4500',
    rgb: '255,69,0',
    desc: 'Post to any subreddit',
    required: false,
    infoOnly: false,
    oauthType: true,  // ← uses OAuth Connect flow
    keys: [],
    helperText: null,
    helperLink: null,
    guide: null,
    note: null,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    Icon: FaInstagram,
    color: '#e1306c',
    rgb: '225,48,108',
    desc: 'Generate optimized captions for Instagram',
    required: false,
    infoOnly: true,
    oauthType: false,
    fixedStatus: 'clipboard',
    infoCard: 'PostPilot generates optimized Instagram captions. Use the Copy button to paste into Instagram. Direct posting requires Meta Business API access.',
    advancedKeys: null,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    Icon: FaWhatsapp,
    color: '#25d366',
    rgb: '37,211,102',
    desc: 'Share-optimized messages via WhatsApp',
    required: false,
    infoOnly: true,
    oauthType: false,
    fixedStatus: 'share',
    infoCard: "PostPilot generates WhatsApp-optimized messages and opens WhatsApp with the text pre-filled. No API keys needed — it just works.",
    advancedKeys: null,
  },
]
