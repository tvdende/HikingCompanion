/**
 * Showcase & Landing Page Content Configuration
 * 
 * Dit bronbestand bevat alle teksten, feature-cards, demo-data en inloginstructies
 * voor de landingspagina voor niet-ingelogde bezoekers.
 * Pas teksten en data hier eenvoudig aan om direct de weergave in de app te wijzigen.
 */

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
  };
}

export const showcaseContent: ShowcaseContent = {
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
          { label: 'Totale Afstand', value: '28.4', unit: 'km' },
          { label: 'Klimmen', value: '+1,120', unit: 'm' },
          { label: 'Dalen', value: '-980', unit: 'm' },
          { label: 'Trackpoints', value: '1,420', unit: 'pts' },
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
          { label: 'Huidige Snelheid', value: '4.2', unit: 'km/u' },
          { label: 'Resterend', value: '8.6', unit: 'km' },
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
  },
};
