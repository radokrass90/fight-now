'use strict';
// Narrative proposal, kept separate from match rules and saved progression.
const STORY_DATA = {
  "status": "draft",
  "title": {
    "en": "The Last Shift",
    "de": "Die letzte Schicht"
  },
  "intro": {
    "en": "At closing time, a fight invitation reaches fifteen people across Germany. Seven victories earn a seat at the table where the next Night Circuit is decided. For some, the prize is money. For others, it is the chance to stop being used.",
    "de": "Kurz vor Feierabend erreicht fünfzehn Menschen in ganz Deutschland eine Einladung zum Kampf. Sieben Siege bringen einen Platz an den Tisch, an dem über den nächsten Nachtzirkel entschieden wird. Manche wollen Geld. Andere wollen endlich selbst bestimmen."
  },
  "chapters": [
    {
      "title": {
        "en": "01 / After closing",
        "de": "01 / Nach Ladenschluss"
      },
      "text": {
        "en": "Murat finds his crew's unpaid wages listed as a tournament debt. He joins to recover them. In St. Pauli, Yasmin has received an invitation with the same seal. Their first disagreement is simple. She wants to win the purse. He wants to know who put his crew's names on it.",
        "de": "Murat entdeckt die ausstehenden Löhne seiner Kolonne auf einer Schuldenliste des Turniers. Er tritt an, um sie zurückzuholen. In St. Pauli hat Yasmin eine Einladung mit demselben Siegel bekommen. Sie will das Preisgeld gewinnen. Er will wissen, wer die Namen seiner Kollegen auf die Liste gesetzt hat."
      }
    },
    {
      "title": {
        "en": "02 / The night circuit",
        "de": "02 / Der Nachtzirkel"
      },
      "text": {
        "en": "Each district has a different story about the prize. Nadine recognizes an old promoter's promises. Leyla and Emre trace the invitations between garages, clubs and loading yards. Dragan has financed the circuit and expects every winner to owe him a favor.",
        "de": "In jedem Viertel erzählt man etwas anderes über den Preis. Nadine erkennt die Versprechen eines alten Veranstalters wieder. Leyla und Emre verfolgen die Einladungen zwischen Werkstätten, Clubs und Lagerhöfen. Dragan hat den Zirkel finanziert und erwartet von jedem Sieger einen Gefallen."
      }
    },
    {
      "title": {
        "en": "03 / The price of a win",
        "de": "03 / Der Preis des Sieges"
      },
      "text": {
        "en": "The final invitation offers Murat his crew's money if he agrees to collect the next fighter's debt. He refuses. After the last fight, Nadine opens the doors and Tomasz puts the ledger on the wall for everyone to read. The winner must decide what to do with a circuit that now has no owner.",
        "de": "Die letzte Einladung verspricht Murat das Geld seiner Kolonne, wenn er die Schulden des nächsten Kämpfers eintreibt. Er lehnt ab. Nach dem letzten Kampf öffnet Nadine die Türen. Tomasz bringt die Schuldenliste für alle sichtbar an die Wand. Der Sieger muss entscheiden, was aus einem Zirkel wird, der jetzt niemandem gehört."
      }
    }
  ],
  "fighters": {
    "murat": {
      "en": "Recover his crew's wages without collecting someone else's debt.",
      "de": "Die Löhne seiner Kolonne zurückholen, ohne dafür die Schulden anderer einzutreiben."
    },
    "yasmin": {
      "en": "Use the purse to open a small training room above the bar. She challenges Murat when his search threatens the prize.",
      "de": "Mit dem Preisgeld einen Trainingsraum über der Bar eröffnen. Sie stellt Murat zur Rede, als seine Suche den Gewinn gefährdet."
    },
    "dragan": {
      "en": "Keep the circuit dependent on his loans. Every favor he offers creates a new obligation.",
      "de": "Den Zirkel von seinen Krediten abhängig halten. Jeder seiner Gefallen schafft eine neue Verpflichtung."
    },
    "kevin": {
      "en": "Win back the respect he lost with his stadium ban. Nadine insists he earn it without bringing his crowd into the fight.",
      "de": "Den Respekt zurückgewinnen, den ihn das Stadionverbot kostete. Nadine verlangt, dass er ohne die Hilfe seiner Gruppe kämpft."
    },
    "leyla": {
      "en": "Recover a garage's seized tools. She follows the van that delivers the circuit's equipment.",
      "de": "Die beschlagnahmten Werkzeuge einer Werkstatt zurückholen. Sie folgt dem Wagen mit der Turnierausrüstung."
    },
    "tomasz": {
      "en": "Put the circuit's promises where everyone can see them. He needs proof before painting names on a wall.",
      "de": "Die Versprechen des Zirkels öffentlich machen. Bevor er Namen an eine Wand malt, braucht er Beweise."
    },
    "hakan": {
      "en": "Protect the market stalls from another collection round. He distrusts Dragan's offer to erase their debts.",
      "de": "Die Marktstände vor einer weiteren Schuldeneintreibung schützen. Dragans Angebot, ihre Schulden zu streichen, misstraut er."
    },
    "nadine": {
      "en": "Stop the promoter repeating the deal that cost her job. Her rule is clear. A fighter may always leave.",
      "de": "Verhindern, dass der Veranstalter das Geschäft wiederholt, das sie den Job kostete. Ihre Regel gilt für alle. Jeder Kämpfer darf gehen."
    },
    "emre": {
      "en": "Find out who has been using his taxi route to deliver the invitations. He agrees to drive Leyla if she shares what she learns.",
      "de": "Herausfinden, wer seine Taxiroute für die Einladungen nutzt. Er fährt Leyla, wenn sie ihre Erkenntnisse mit ihm teilt."
    },
    "boris": {
      "en": "Recover a dock crew's missing payment. He recognizes the circuit's crates and refuses to unload them again.",
      "de": "Die verschwundene Bezahlung einer Hafenmannschaft zurückholen. Er erkennt die Kisten des Zirkels und will sie nicht noch einmal entladen."
    },
    "jasmin": {
      "en": "Earn enough to keep her basement gym open. She wants a clear match contract before lending anyone her name.",
      "de": "Genug verdienen, um ihr Kellerstudio zu behalten. Bevor sie ihren Namen hergibt, verlangt sie einen klaren Kampfvertrag."
    },
    "adem": {
      "en": "Keep his shop out of the circuit's collections. He feeds the fighters, then asks them to compare their invitations.",
      "de": "Seinen Laden aus den Forderungen des Zirkels heraushalten. Er gibt den Kämpfern etwas zu essen und lässt sie ihre Einladungen vergleichen."
    },
    "marco": {
      "en": "Trade a stolen ledger for a clean exit. Tomasz asks him to hand it over without naming a price.",
      "de": "Ein gestohlenes Schuldenbuch gegen einen sicheren Ausstieg tauschen. Tomasz verlangt, dass er es ohne Gegenleistung herausgibt."
    },
    "fatima": {
      "en": "Recover equipment taken from the scrapyard. She backs Boris when he stops a shipment.",
      "de": "Dem Schrottplatz weggenommenes Gerät zurückholen. Als Boris eine Lieferung stoppt, stellt sie sich hinter ihn."
    },
    "danny": {
      "en": "Sell his invitation and disappear. When he discovers his own name in the ledger, he stays to hear how it got there.",
      "de": "Seine Einladung verkaufen und verschwinden. Als er den eigenen Namen im Schuldenbuch findet, bleibt er, um den Grund zu erfahren."
    }
  },
  "closing": {
    "en": "Murat pays his crew and leaves his own winnings in the shared purse. Yasmin proposes open accounts and a fixed split for every fighter. Dragan walks out before they vote. At dawn, the workers return to their shifts. The next invitation will carry their rules.",
    "de": "Murat zahlt seine Kolonne aus und lässt seinen eigenen Gewinn in der gemeinsamen Kasse. Yasmin schlägt offene Bücher und feste Anteile für jeden Kämpfer vor. Dragan geht vor der Abstimmung. Im Morgengrauen beginnen die Schichten wieder. Auf der nächsten Einladung stehen ihre Regeln."
  }
};
