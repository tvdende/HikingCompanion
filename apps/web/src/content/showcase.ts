/**
 * Showcase & Landing Page Content Configuration
 * 
 * Bilingual showcase content for both Dutch (default) and English.
 */

import type { Locale } from '../i18n/types';

export interface FeatureHighlight {
  id: string;
  badge: string;
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface DemoTab {
  id: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  badge: string;
  previewType: 'gpx-analysis' | 'dual-modes' | 'offline-maps';
  stats?: { label: string; value: string; unit?: string }[];
  explanation: string[];
}

export interface ShowcaseContent {
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaLogin: string;
    ctaExplore: string;
  };
  features: FeatureHighlight[];
  interactiveDemo: {
    sectionTitle: string;
    sectionSubtitle: string;
    tabs: DemoTab[];
  };
  loginGuide: {
    title: string;
    subtitle: string;
    steps: { number: string; title: string; text: string }[];
    ctaButton: string;
    ctaSubtext: string;
  };
  simulations: {
    gpxPreviewTag: string;
    gpxSampleTrail: string;
    highestPointLabel: string;
    plannerTitle: string;
    plannerDesc: string;
    plannerStagesPill: string;
    plannerGpxPill: string;
    plannerLayersPill: string;
    companionTitle: string;
    companionDesc: string;
    companionSpeedUnit: string;
    companionRemainingUnit: string;
    offlineBanner: string;
    offlineLocalBufferTitle: string;
    offlineLocalBufferDesc: string;
    offlineGpsTitle: string;
    offlineGpsDesc: string;
  };
}

export const showcaseContentNl: ShowcaseContent = {
  hero: {
    badge: '🌲 Voor Langeafstandswandelaars & Dagtochten',
    headline: 'Plan, Analyseer & Navigeer Jouw Trails',
    subheadline:
      'Hiking Companion combineert geavanceerde GPX-hoogteanalyses, een afleidingsvrije Companion HUD voor onderweg en betrouwbare offline-functionaliteit in één snelle Progressive Web App.',
    ctaLogin: 'Inloggen / Account Openen',
    ctaExplore: 'Bekijk Functionaliteiten',
  },
  features: [
    {
      id: 'gpx-engine',
      badge: 'Nauwkeurige GPX Engine',
      icon: '📈',
      title: 'Diepgaande GPX & Hoogteanalyse',
      description:
        'Upload moeiteloos .gpx bestanden via drag-and-drop of bestandsselectie. Onze engine berekent geodetische afstanden en stijg-/daalmeters tot op de meter nauwkeurig.',
      bullets: [
        'Geodetische afstandsmeting over het aardoppervlak',
        'Direct inzicht in totale hoogtemeters stijgen en dalen',
        'Her-exporteer bewerkte routes naar standaarden GPX 1.1',
      ],
    },
    {
      id: 'dual-modes',
      badge: 'Slimme Werkmodi',
      icon: '🧭',
      title: 'Planner vs. Companion Modus',
      description:
        'Thuis plan je de etappes en rustpunten; onderweg schakel je met één tik om naar een gestroomlijnde Companion HUD met extra groot contrast.',
      bullets: [
        'Planner Modus: Volledig kaartoverzicht, etappes en route-editing',
        'Companion HUD: Grote typografie, batterijbesparing en essentiële statistieken',
        'Eén-klik moduswisseling zonder laadtijden',
      ],
    },
    {
      id: 'offline-pwa',
      badge: 'Offline-First',
      icon: '⚡',
      title: 'Geen Bereik? Geen Probleem.',
      description:
        'Dankzij moderne Service Worker caching en MapLibre vector-tegels blijft Hiking Companion soepel functioneren, zelfs diep in de bergen of in dichte bossen.',
      bullets: [
        'Installeerbaar als volwaardige app op iOS, Android en Desktop',
        'Voorgecachete applicatie-shell en snelle opstarttijden',
        'Veilige Cloudflare serverless back-end met zero latency',
      ],
    },
  ],
  interactiveDemo: {
    sectionTitle: 'Ontdek wat Hiking Companion kan',
    sectionSubtitle: 'Klik op de onderstaande tabs voor een interactieve voorvertoning van de functies.',
    tabs: [
      {
        id: 'gpx-demo',
        tabLabel: '1. GPX & Hoogtemeters',
        badge: 'Live Route Analyse',
        title: 'Geodetische afstanden & hoogteprofiel',
        subtitle: 'Upload een route en zie in realtime de etappedetails en hoogtegrafiek.',
        previewType: 'gpx-analysis',
        stats: [
          { label: 'Totale Afstand', value: '28,4', unit: 'km' },
          { label: 'Klimmen', value: '+1.120', unit: 'm' },
          { label: 'Dalen', value: '-980', unit: 'm' },
          { label: 'Trackpoints', value: '1.420', unit: 'pts' },
        ],
        explanation: [
          'Ondersteunt alle gangbare GPX bestanden van Garmin, Strava, Komoot en AllTrails.',
          'Automatische filtering en afvlakking van GPS-ruis voor betrouwbare stijgingsmeters.',
          'Direct exporteren en delen met wandelpartners.',
        ],
      },
      {
        id: 'modes-demo',
        tabLabel: '2. Planner vs. Companion',
        badge: 'Dubbele Gebruikersinterface',
        title: 'Schakel direct tussen thuis voorbereiden en buiten wandelen',
        subtitle: 'Geoptimaliseerd voor gebruik met handschoenen en in fel zonlicht.',
        previewType: 'dual-modes',
        stats: [
          { label: 'Huidige Snelheid', value: '4,2', unit: 'km/u' },
          { label: 'Resterend', value: '8,6', unit: 'km' },
          { label: 'Geschatte Duur', value: '02:05', unit: 'uur' },
        ],
        explanation: [
          'Planner: Uitgebreide kaartlagen, etappe-overzichten en GPX import/export balk.',
          'Companion HUD: Extra hoog contrast, minimale knoppen en maximale focus op het pad.',
          'Directe GPS-locatie bepaling met kompasoriëntatie.',
        ],
      },
      {
        id: 'offline-demo',
        tabLabel: '3. Offline PWA',
        badge: 'Offline Betrouwbaarheid',
        title: 'Progressive Web App met lokale databuffers',
        subtitle: 'Installeer zonder app store direct vanuit je browser.',
        previewType: 'offline-maps',
        stats: [
          { label: 'PWA Cache', value: '100%', unit: 'Gereed' },
          { label: 'Installatie', value: '1-klik', unit: 'PWA' },
          { label: 'Verbinding', value: 'Offline OK', unit: 'Status' },
        ],
        explanation: [
          'Werkt op iPhone, iPad, Android smartphones en Windows/macOS laptops.',
          'Routes en instellingen worden lokaal gebufferd.',
          'Veilige authenticatie via OAuth (Google, GitHub, Microsoft) zodra je weer online bent.',
        ],
      },
    ],
  },
  loginGuide: {
    title: 'Begin in 3 simpele stappen',
    subtitle: 'Meld je gratis aan om direct routes te importeren en op te slaan.',
    steps: [
      {
        number: '1',
        title: 'Klik op Inloggen',
        text: 'Gebruik de knop rechtsboven of de actieknoppen op deze pagina om het inlogvenster te openen.',
      },
      {
        number: '2',
        title: 'Kies jouw gewenste account',
        text: 'Meld je aan met je vertrouwde Google-, GitHub- of Microsoft-account. Geen nieuw wachtwoord nodig.',
      },
      {
        number: '3',
        title: 'Start met plannen',
        text: 'Je krijgt direct volledige toegang tot de kaart, de GPX-import functionaliteit en het routebeheer.',
      },
    ],
    ctaButton: 'Nu Inloggen & Starten',
    ctaSubtext: 'Directe toegang • Geen creditcard nodig • 100% gratis & open source',
  },
  simulations: {
    gpxPreviewTag: 'GPX Preview',
    gpxSampleTrail: '📍 Pieterpad: Etappe 3 (Zuidlaren - Rolde)',
    highestPointLabel: 'Hoogste punt: 115m (km 14,2)',
    plannerTitle: 'Planner Modus',
    plannerDesc: 'Interactieve vector-kaart met alle etappes, waypoints en route-details.',
    plannerStagesPill: 'Etappes (3)',
    plannerGpxPill: 'GPX Export',
    plannerLayersPill: 'Kaartlagen',
    companionTitle: 'Companion HUD',
    companionDesc: 'Extra groot contrast, minimale interface, gericht op veilige navigatie.',
    companionSpeedUnit: 'km/u',
    companionRemainingUnit: 'km over',
    offlineBanner: 'PWA Offline Mode Actief • Alle vectortegels gebufferd',
    offlineLocalBufferTitle: 'Lokale Routebuffer',
    offlineLocalBufferDesc: 'Geen dataverbinding nodig om je geladen GPX routes te raadplegen.',
    offlineGpsTitle: 'Standalone GPS Tracking',
    offlineGpsDesc: 'Je interne GPS werkt overal ter wereld, onafhankelijk van 4G/5G.',
  },
};

export const showcaseContentEn: ShowcaseContent = {
  hero: {
    badge: '🌲 For Long-Distance Hikers & Day Treks',
    headline: 'Plan, Analyze & Navigate Your Trails',
    subheadline:
      'Hiking Companion combines advanced GPX elevation analysis, a distraction-free Companion HUD for the trail, and robust offline capability in one fast Progressive Web App.',
    ctaLogin: 'Log in / Create Account',
    ctaExplore: 'Explore Features',
  },
  features: [
    {
      id: 'gpx-engine',
      badge: 'Accurate GPX Engine',
      icon: '📈',
      title: 'Deep GPX & Elevation Analysis',
      description:
        'Effortlessly upload .gpx files via drag-and-drop or file selector. Our engine calculates geodetic distances and elevation gains/losses with meter-level precision.',
      bullets: [
        'Geodetic distance calculation over the earth’s surface',
        'Instant visibility into total ascent and descent elevation',
        'Re-export edited trails to standard GPX 1.1 format',
      ],
    },
    {
      id: 'dual-modes',
      badge: 'Smart Dual Modes',
      icon: '🧭',
      title: 'Planner vs. Companion Mode',
      description:
        'Plan stages and waypoints at home; switch with a single tap to a streamlined Companion HUD with ultra-high contrast on the trail.',
      bullets: [
        'Planner Mode: Full map overview, stages, and route editing',
        'Companion HUD: Large typography, battery saving, and essential metrics',
        'One-click mode switching with zero load times',
      ],
    },
    {
      id: 'offline-pwa',
      badge: 'Offline-First',
      icon: '⚡',
      title: 'No Cell Signal? No Problem.',
      description:
        'Thanks to modern Service Worker caching and MapLibre vector tiles, Hiking Companion keeps running smoothly even deep in the mountains or dense forests.',
      bullets: [
        'Installable as a full app on iOS, Android, and Desktop',
        'Pre-cached application shell and ultra-fast launch times',
        'Secure Cloudflare serverless back-end with zero latency',
      ],
    },
  ],
  interactiveDemo: {
    sectionTitle: 'Discover What Hiking Companion Can Do',
    sectionSubtitle: 'Click the tabs below for an interactive preview of key features.',
    tabs: [
      {
        id: 'gpx-demo',
        tabLabel: '1. GPX & Elevation',
        badge: 'Live Route Analysis',
        title: 'Geodetic Distances & Elevation Profile',
        subtitle: 'Upload a route and inspect real-time stage details and elevation graph.',
        previewType: 'gpx-analysis',
        stats: [
          { label: 'Total Distance', value: '28.4', unit: 'km' },
          { label: 'Ascent', value: '+1,120', unit: 'm' },
          { label: 'Descent', value: '-980', unit: 'm' },
          { label: 'Trackpoints', value: '1,420', unit: 'pts' },
        ],
        explanation: [
          'Supports all common GPX files from Garmin, Strava, Komoot, and AllTrails.',
          'Automatic GPS noise filtering and smoothing for trustworthy ascent metrics.',
          'Instant export and sharing with hiking partners.',
        ],
      },
      {
        id: 'modes-demo',
        tabLabel: '2. Planner vs. Companion',
        badge: 'Dual User Interface',
        title: 'Instantly switch between home planning and outdoor hiking',
        subtitle: 'Optimized for glove usage and bright sunlight readability.',
        previewType: 'dual-modes',
        stats: [
          { label: 'Current Speed', value: '4.2', unit: 'km/h' },
          { label: 'Remaining', value: '8.6', unit: 'km' },
          { label: 'Estimated Time', value: '02:05', unit: 'hours' },
        ],
        explanation: [
          'Planner: Rich map layers, stage summaries, and GPX import/export toolbar.',
          'Companion HUD: Extra high contrast, minimal buttons, and maximum trail focus.',
          'Instant GPS positioning with compass heading orientation.',
        ],
      },
      {
        id: 'offline-demo',
        tabLabel: '3. Offline PWA',
        badge: 'Offline Reliability',
        title: 'Progressive Web App with local data caching',
        subtitle: 'Install without an app store directly from your browser.',
        previewType: 'offline-maps',
        stats: [
          { label: 'PWA Cache', value: '100%', unit: 'Ready' },
          { label: 'Installation', value: '1-click', unit: 'PWA' },
          { label: 'Connection', value: 'Offline OK', unit: 'Status' },
        ],
        explanation: [
          'Runs on iPhone, iPad, Android smartphones, and Windows/macOS laptops.',
          'Routes and preferences are cached locally.',
          'Secure OAuth authentication (Google, GitHub, Microsoft) whenever you reconnect.',
        ],
      },
    ],
  },
  loginGuide: {
    title: 'Get Started in 3 Simple Steps',
    subtitle: 'Sign up for free to import and save routes immediately.',
    steps: [
      {
        number: '1',
        title: 'Click Log in',
        text: 'Use the top-right button or the action buttons on this page to open the login dialog.',
      },
      {
        number: '2',
        title: 'Choose your preferred account',
        text: 'Sign in with your trusted Google, GitHub, or Microsoft account. No new password needed.',
      },
      {
        number: '3',
        title: 'Start planning',
        text: 'You instantly receive full access to the map, GPX import, and route management.',
      },
    ],
    ctaButton: 'Log in & Get Started',
    ctaSubtext: 'Instant access • No credit card required • 100% free & open source',
  },
  simulations: {
    gpxPreviewTag: 'GPX Preview',
    gpxSampleTrail: '📍 West Highland Way: Stage 3 (Inverarnan - Tyndrum)',
    highestPointLabel: 'Highest point: 115m (km 14.2)',
    plannerTitle: 'Planner Mode',
    plannerDesc: 'Interactive vector map with all stages, waypoints, and trail details.',
    plannerStagesPill: 'Stages (3)',
    plannerGpxPill: 'GPX Export',
    plannerLayersPill: 'Map Layers',
    companionTitle: 'Companion HUD',
    companionDesc: 'Extra high contrast, minimal interface focused on safe navigation.',
    companionSpeedUnit: 'km/h',
    companionRemainingUnit: 'km left',
    offlineBanner: 'PWA Offline Mode Active • All vector tiles cached',
    offlineLocalBufferTitle: 'Local Route Cache',
    offlineLocalBufferDesc: 'No cellular connection needed to inspect your loaded GPX routes.',
    offlineGpsTitle: 'Standalone GPS Tracking',
    offlineGpsDesc: 'Your device GPS works everywhere on earth, independent of 4G/5G.',
  },
};

export function getShowcaseContent(locale: Locale): ShowcaseContent {
  return locale === 'en' ? showcaseContentEn : showcaseContentNl;
}

// Default export in Dutch for backwards compatibility
export const showcaseContent = showcaseContentNl;
