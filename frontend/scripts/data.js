/**
 * Atelier Contracting — Architectural Core v2.1
 * Central State & Architectural Folio Data Store
 */

const ATELIER_DATA = {
  studio: {
    name: "ATELIER CONTRACTING",
    division: "Atelier Studio 05 — Architectural Core",
    version: "v2.1",
    status: "11:42 BST - STUDIO 01 • ACTIVE DRAFTING CYCLE",
    director: {
      name: "Julian Vane",
      role: "PRINCIPAL DIRECTOR",
      avatar: "JV"
    },
    leadArchitect: {
      name: "Sameer Verma",
      role: "Partner & Lead Technical Director",
      desk: "Direct Desk Ext: #104",
      phone: "+91 98200 11200",
      avatar: "SV"
    },
    metrics: {
      activeClients: 28,
      onboardedThisMonth: 4,
      activeProjects: 14,
      inExecution: 10,
      inDesign: 4,
      drawingsSheets: 142,
      revisedThisWeek: 18,
      pendingSiteUpdates: 6,
      storageCommittedGb: 412.8,
      livePortalsActive: 24,
      liveStreamNodes: 19
    }
  },

  clients: [
    {
      id: "c-rahul",
      name: "Rahul Sharma",
      phone: "+91 98201 44521",
      email: "rahul.sharma@gmail.com",
      projectTitle: "Sharma Residence",
      typology: "4BHK Luxury Apartment, 14th Road, Juhu",
      location: "14th Road, Juhu, Mumbai",
      areaSqFt: 4050,
      refId: "AT-JHU-404",
      vaultKey: "PR0231",
      phase: "Phase 2 — Joinery & Electricals",
      completionPct: 64,
      status: "ACTIVE IN EXECUTION",
      statusType: "execution",
      leadArchitect: "Sameer Verma",
      liveDraft: "Rev 03 Floor Plan Live",
      liveDraftTimestamp: "Yesterday, 09:30 AM • Lead Arch",
      counts: {
        blueprints: 14,
        specs: 8,
        siteLogs: 19
      },
      security: {
        username: "rahul.sharma",
        pin: "9038",
        lastLogin: "Today, 09:14 AM",
        device: "iPad Pro • iOS 19 (Juhu IP: 115.112.9.2)",
        watermarkStrict: true,
        authStatus: "Full Access (14/14 Sheets)"
      },
      heroImage: "assets/reference/media_1791658226164.png",
      auditTrail: [
        { action: "Downloaded Kitchen Layout Rev 04 (A1-DWG/PDF)", time: "Yesterday, 14:05 IST", device: "iPad Pro (Client IP)" },
        { action: "Approved Material Concession: Fluted Natural White Oak", time: "18 Sep 2026, 11:20 IST", device: "Digital Client Signature" },
        { action: "Portal Authenticated via Registered OTP (+91 98201 44521)", time: "Today, 09:14 AM", device: "Safari Mobile" }
      ]
    },
    {
      id: "c-priya",
      name: "Priya Mehta",
      phone: "+91 99302 11954",
      email: "priya.mehta@zenithpartners.com",
      projectTitle: "Mehta Apartment",
      typology: "3BHK Penthouse Renovation, Pali Hill, Bandra West",
      location: "Pali Hill, Bandra West, Mumbai",
      areaSqFt: 2800,
      refId: "AT-BND-302",
      vaultKey: "PR0188",
      phase: "Design Phase (Stage 3 — MEP & Lighting)",
      completionPct: 38,
      status: "DESIGN REVISION",
      statusType: "design",
      leadArchitect: "Tanvi K.",
      liveDraft: "Rev 02 Electricals & Automation Hub",
      liveDraftTimestamp: "Yesterday, 16:15 • MEP Studio",
      counts: {
        blueprints: 11,
        specs: 6,
        siteLogs: 4
      },
      security: {
        username: "priya.mehta",
        pin: "4412",
        lastLogin: "Yesterday, 16:30",
        device: "MacBook Pro • macOS Sequoia",
        watermarkStrict: true,
        authStatus: "Restricted Stage Review (11/11)"
      },
      heroImage: "assets/reference/media_1791658226034.png",
      auditTrail: [
        { action: "Reviewed Schematic Space Planning Rev 02", time: "18 Sep 2026, 17:40 IST", device: "MacBook Pro" },
        { action: "Requested Dimmer Channel Addition to Master Balcony", time: "17 Sep 2026, 12:10 IST", device: "Portal Annotation" }
      ]
    },
    {
      id: "c-arjun",
      name: "Arjun Kapoor",
      phone: "+91 97119 58230",
      email: "arjun.kapoor@kapoorgroup.in",
      projectTitle: "Kapoor Villa",
      typology: "Coastal Estate, Mandwa Shore, Alibaug",
      location: "Mandwa Shore, Alibaug",
      areaSqFt: 8200,
      refId: "AT-ALB-108",
      vaultKey: "PR0315",
      phase: "Active Construction (Civil Structure & Joinery)",
      completionPct: 78,
      status: "ON SITE",
      statusType: "execution",
      leadArchitect: "Sameer Verma",
      liveDraft: "Rev 04 Kitchen Layout & Millwork",
      liveDraftTimestamp: "16 Apr, 11:20 • Interior Lead",
      counts: {
        blueprints: 22,
        specs: 14,
        siteLogs: 31
      },
      security: {
        username: "arjun.kapoor",
        pin: "7721",
        lastLogin: "15 Apr, 10:15",
        device: "iPhone 16 Pro",
        watermarkStrict: true,
        authStatus: "Full Access (22/22 Sheets)"
      },
      heroImage: "assets/reference/media_1791658226190.png",
      auditTrail: [
        { action: "Inspected Pergola Structural Framing Rev 03 Drawing", time: "15 Apr 2026, 10:18 IST", device: "iPhone 16 Pro" },
        { action: "Civil Casting Clearance Signed by Ar. Sameer V.", time: "14 Apr 2026, 18:00 IST", device: "Site Terminal 02" }
      ]
    },
    {
      id: "c-neha",
      name: "Neha Patel",
      phone: "+91 98409 32119",
      email: "neha.patel@crestcapital.com",
      projectTitle: "Patel Residence",
      typology: "High-Rise Duplex Penthouse, Worli Sea Face",
      location: "Worli Sea Face, Mumbai",
      areaSqFt: 5100,
      refId: "AT-WRL-501",
      vaultKey: "PR0094",
      phase: "Finishing & Handover Stage",
      completionPct: 96,
      status: "FINAL HANDOVER",
      statusType: "handover",
      leadArchitect: "Julian Vane",
      liveDraft: "Handover Pack & Sign-off Dossier",
      liveDraftTimestamp: "14 Apr, 14:00 • Director Sign",
      counts: {
        blueprints: 18,
        specs: 12,
        siteLogs: 46
      },
      security: {
        username: "neha.patel",
        pin: "8302",
        lastLogin: "14 Apr, 14:00",
        device: "Chrome / Windows 11",
        watermarkStrict: true,
        authStatus: "Handover Archive Granted (18/18)"
      },
      heroImage: "assets/reference/media_1791658226127.png",
      auditTrail: [
        { action: "As-Built Final Dossier & Appliance Warranties Downloaded", time: "14 Apr 2026, 14:15 IST", device: "Chrome Desktop" },
        { action: "Final Handover Protocol Certificate Executed", time: "14 Apr 2026, 14:00 IST", device: "Director Terminal" }
      ]
    }
  ],

  // Registered Drawings for Sharma Residence (and cross-project portfolio)
  drawings: [
    {
      id: "drw-a101",
      sheetNumber: "SHEET A-101",
      code: "ARCH-PLAN-01",
      title: "Floor Plan — Master Layout & Balcony Structural Offsets",
      shortTitle: "Floor Plan — Architectural Layout",
      category: "floor-plan",
      categoryLabel: "FLOOR PLAN",
      projectRef: "c-rahul",
      currentRev: "REV 03",
      isLiveOnSite: true,
      scale: "1:50 @ A1",
      updatedDate: "24 Sep 2026",
      updatedTime: "14:15 IST",
      author: "Ar. Sameer V. (Lead Architect)",
      fileName: "SHARMA_FL_03_FINAL.DWG",
      fileSize: "42.8 MB",
      format: "AutoCAD 2026 DWG + Vector PDF (600 DPI)",
      description: "Adjusted master bedroom balcony structural offsets to clear vertical plumbing chase as surveyed on 23 Sep. General masonry, spatial partitions & door swing radiuses locked.",
      revisions: [
        {
          rev: "REV 03 (CURRENT)",
          badge: "ACTIVE ON SITE",
          title: "Balcony Structural Offsets & Column Re-centering",
          date: "Uploaded 24 Sep 2026 by Ar. Sameer V.",
          note: "Adjusted master bedroom balcony structural offsets per contractor request on casting day. Approved by Structural Consultant.",
          status: "current",
          isDownloadable: true
        },
        {
          rev: "REV 02 (SUPERSEDED)",
          badge: "SUPERSEDED",
          title: "Client Approved Revised Foyer & Walk-in Wardrobe Passage",
          date: "Uploaded 10 Sep 2026 by Ar. Sameer V.",
          note: "Client approved revised foyer dimensions and consolidated electrical conduit routing in foyer vestibule.",
          status: "archived",
          isDownloadable: true
        },
        {
          rev: "REV 01 (SUPERSEDED)",
          badge: "SUPERSEDED",
          title: "Initial Schematic Layout & Demolition Plan",
          date: "Uploaded 15 Aug 2026 by Ar. Tanvi K.",
          note: "Initial schematic base drawings sent for municipal compliance review and drill breakdown.",
          status: "archived",
          isDownloadable: true
        }
      ]
    },
    {
      id: "drw-k201",
      sheetNumber: "SHEET K-201",
      code: "MILL-KIT-04",
      title: "Kitchen Layout & Modular Joinery",
      shortTitle: "Kitchen Layout & Modular Cabinetry",
      category: "kitchen",
      categoryLabel: "KITCHEN & JOINERY",
      projectRef: "c-rahul",
      currentRev: "REV 04",
      isLiveOnSite: true,
      scale: "1:25 @ A1",
      updatedDate: "24 Sep 2026",
      updatedTime: "11:30 IST",
      author: "Ar. Sameer V. (Interior Lead)",
      fileName: "SHARMA_KIT_JOINERY_REV04.DWG",
      fileSize: "44.5 MB",
      format: "AutoCAD 2026 DWG + PDF",
      description: "Island counter elevations, carcass depths, wet and dry kitchen segregation, integrated Miele appliances & chimney extraction shaft.",
      revisions: [
        {
          rev: "REV 04 (CURRENT)",
          badge: "ACTIVE ON SITE",
          title: "Quartz Island Undermount Sink & Blum Runner Offsets",
          date: "Uploaded 24 Sep 2026 by Ar. Sameer V.",
          note: "Revised island quartz support bracing per stone fabricator specifications.",
          status: "current"
        },
        {
          rev: "REV 03 (SUPERSEDED)",
          badge: "SUPERSEDED",
          title: "Hob Ventilation & Microwave Tall Unit Niche",
          date: "Uploaded 12 Sep 2026 by MEP Consultant",
          note: "Adjusted rear duct clearance to 150mm.",
          status: "archived"
        }
      ]
    },
    {
      id: "drw-a104",
      sheetNumber: "SHEET A-104",
      code: "INT-FURN-02",
      title: "Furniture Layout & Space Planning",
      shortTitle: "Furniture & Millwork Plan",
      category: "furniture",
      categoryLabel: "FURNITURE LAYOUT",
      projectRef: "c-rahul",
      currentRev: "REV 02",
      isLiveOnSite: true,
      scale: "1:50 @ A1",
      updatedDate: "22 Sep 2026",
      updatedTime: "16:00 IST",
      author: "Ar. Tanvi K.",
      fileName: "SHARMA_FURNITURE_REV02.DWG",
      fileSize: "40.1 MB",
      format: "AutoCAD 2026 DWG + PDF",
      description: "Complete living room configuration, freestanding Italian marble sectional specs, fluted wall accents, vanities & custom rugs.",
      revisions: [
        {
          rev: "REV 02 (CURRENT)",
          badge: "ACTIVE ON SITE",
          title: "Sectional Sofas Footprint & Dining Passage Clearance",
          date: "Uploaded 22 Sep 2026 by Ar. Tanvi K.",
          note: "Widened formal dining service passage to 1200mm.",
          status: "current"
        }
      ]
    },
    {
      id: "drw-e301",
      sheetNumber: "SHEET E-301",
      code: "ELEC-LGT-02",
      title: "Electrical & Lighting Plan",
      shortTitle: "False Ceiling & Ambient Lighting",
      category: "electrical",
      categoryLabel: "ELECTRICAL LAYOUT",
      projectRef: "c-rahul",
      currentRev: "REV 02",
      isLiveOnSite: true,
      scale: "1:50 @ A1",
      updatedDate: "20 Sep 2026",
      updatedTime: "18:20 IST",
      author: "MEP Consultant / Sameer V.",
      fileName: "SHARMA_ELEC_LGT_REV02.DWG",
      fileSize: "32.5 MB",
      format: "AutoCAD DWG + PDF",
      description: "Reflected ceiling layout, magnetic track feeds, Lutron Homeworks automation loop schedule, lighting fixtures specs & architectural coves.",
      revisions: [
        {
          rev: "REV 02 (CURRENT)",
          badge: "ACTIVE ON SITE",
          title: "Magnetic Track Driver Locations & Automation Keypads",
          date: "Uploaded 20 Sep 2026 by MEP Consultant",
          note: "Relocated master keypad to entry jamb.",
          status: "current"
        }
      ]
    },
    {
      id: "drw-ref105",
      sheetNumber: "SHEET REF-105",
      code: "REF-HVAC-02",
      title: "False Ceiling & HVAC Coordination",
      shortTitle: "Ceiling Datum & VRV Ducts",
      category: "ceiling",
      categoryLabel: "FALSE CEILING",
      projectRef: "c-rahul",
      currentRev: "REV 02",
      isLiveOnSite: true,
      scale: "1:50 @ A1",
      updatedDate: "20 Sep 2026",
      updatedTime: "12:15 IST",
      author: "MEP Lead Engineer",
      fileName: "SHARMA_CEILING_HVAC_02.DWG",
      fileSize: "49.0 MB",
      format: "AutoCAD DWG + PDF",
      description: "Level datum elevations, shadowline perimeter trims, Daikin VRV ducted FCU placements & linear architectural slot diffusers.",
      revisions: [
        {
          rev: "REV 02 (CURRENT)",
          badge: "ACTIVE ON SITE",
          title: "Shadowline Detailing & Living Room Drop Level Alignment",
          date: "Uploaded 20 Sep 2026",
          note: "Preserved 3100mm clear ceiling height in central salon.",
          status: "current"
        }
      ]
    },
    {
      id: "drw-wd402",
      sheetNumber: "SHEET WD-402",
      code: "MILL-WRD-03",
      title: "Wardrobe Elevation Detail",
      shortTitle: "Master Suite Walk-in Wardrobe",
      category: "wardrobe",
      categoryLabel: "WARDROBE",
      projectRef: "c-rahul",
      currentRev: "REV 03",
      isLiveOnSite: true,
      scale: "1:20 @ A1",
      updatedDate: "23 Sep 2026",
      updatedTime: "15:45 IST",
      author: "Ar. Sameer V.",
      fileName: "SHARMA_WRD_ELEV_03.DWG",
      fileSize: "43.4 MB",
      format: "AutoCAD DWG + PDF",
      description: "Master walk-in section detail, anodized champagne aluminum framework, fluted glass sliders, integrated leather jewelry drawers & sensor LEDs.",
      revisions: [
        {
          rev: "REV 03 (CURRENT)",
          badge: "ACTIVE ON SITE",
          title: "Fluted Glass Frame Profile & Concealed Hinge Rebates",
          date: "Uploaded 23 Sep 2026 by Ar. Sameer V.",
          note: "Updated hardware specs to Hafele Fineline concealed hinges.",
          status: "current"
        }
      ]
    }
  ],

  // Live Field Site Progress Feed
  siteFeed: [
    {
      id: "feed-1",
      projectRef: "c-rahul",
      category: "CARPENTRY • MILESTONES",
      title: "Kitchen Cabinetry & Carcass Installation",
      timestamp: "24 Sep 2026 • 17:30 IST",
      summary: "Carcass assembly completed in dry kitchen; counter quartz templating scheduled for tomorrow. Marine ply framing inspected by Project Engineer for exact 90-degree plumb alignments. All Blum soft-close runners pre-fitted.",
      author: "Dinesh Solanki (Site Supervisor)",
      verifiedBy: "QUALITY CLEARANCE: PASSED",
      photos: [
        {
          caption: "Dry Kitchen Frame Alignment",
          tag: "Laser Level Calibrated",
          type: "kitchen-frame"
        },
        {
          caption: "Quartz Support Bracing",
          tag: "45mm Heavy-Duty Brackets",
          type: "quartz-brace"
        }
      ],
      metricsBadge: "Passed 90° Plumb Check"
    },
    {
      id: "feed-2",
      projectRef: "c-rahul",
      category: "DRYWALL & MEP",
      title: "Electrical Conduit Routing & POP Coving",
      timestamp: "21 Sep 2026 • 14:15 IST",
      summary: "Concealed wiring tested for master suite lighting points. Fire-retardant FRLS grade cables pulled through heavy-duty PVC conduits. Ceiling coving framework locked in place awaiting first coat skim finishing.",
      author: "Sameer Verma (Lead Architect)",
      verifiedBy: "QUALITY CLEARANCE: PASSED",
      testReport: {
        title: "Megger Insulation Resistance Test",
        val: "120 MΩ [Standard Compliant]",
        status: "VERIFIED"
      },
      photos: [
        {
          caption: "Concealed Conduit Box Verification",
          tag: "FRLS Grade Cables",
          type: "conduit-box"
        }
      ]
    },
    {
      id: "feed-3",
      projectRef: "c-arjun",
      category: "DRYWALL & MEP",
      title: "False Ceiling Framing & AC Plenum Suspension",
      timestamp: "Today, 10:15 AM",
      summary: "Kapoor Villa — Aluminum grid suspension completed in Great Room salon. Daikin FCU drain lines pressure-tested for zero siphon leaks.",
      author: "Alex (Site Supervisor)",
      verifiedBy: "QUALITY CLEARANCE: PASSED",
      photos: [
        {
          caption: "Aluminum Grid Laser Leveled",
          tag: "4 Photos Recorded",
          type: "ceiling-grid"
        }
      ]
    },
    {
      id: "feed-4",
      projectRef: "c-neha",
      category: "FINISHING • HANDOVER PREP",
      title: "Travertine Stone Polishing & Crystalline Seal",
      timestamp: "Yesterday, 17:00",
      summary: "Patel Residence — Diamond buff finish complete across main living gallery floor. Floor hardness and mirror sheen approved by director.",
      author: "Sofia (Finish Director)",
      verifiedBy: "FINAL QUALITY CLEARANCE: PASSED",
      photos: [
        {
          caption: "Diamond Buffed Travertine Gallery",
          tag: "2 Photos Recorded",
          type: "travertine-floor"
        }
      ]
    }
  ],

  // Official Executed Documents & Specifications
  documents: [
    {
      id: "doc-1",
      projectRef: "c-rahul",
      title: "Interior Estimate V2.pdf",
      size: "1.8 MB",
      badge: "APPROVED & EXECUTED",
      category: "contract",
      description: "Bill of Quantities (BOQ), civil fitout stages, millwork specifications and locked commercial disbursements.",
      date: "14 Sep 2026",
      downloadUrl: "#"
    },
    {
      id: "doc-2",
      projectRef: "c-rahul",
      title: "Italian Marble Schedule.pdf",
      size: "3.4 MB",
      badge: "BATU GRIGIO & STATUARIO",
      category: "materials",
      description: "Slab quarry origins, dry-lay dry matching photo book, thickness calibration and anti-stain impregnator specs.",
      date: "18 Sep 2026",
      downloadUrl: "#"
    },
    {
      id: "doc-3",
      projectRef: "c-rahul",
      title: "Modular Kitchen Hardware Warranty.pdf",
      size: "680 KB",
      badge: "10-YR BLUM CERTIFICATE",
      category: "warranty",
      description: "Official factory warranty certificate for Blum Legrabox drawers, Aventos lift systems and Tip-On touch units.",
      date: "20 Sep 2026",
      downloadUrl: "#"
    },
    {
      id: "doc-4",
      projectRef: "c-rahul",
      title: "HVAC & Fresh Air Ventilation Dossier.pdf",
      size: "2.2 MB",
      badge: "DAIKIN VRV CERTIFIED",
      category: "technical",
      description: "Refrigerant pipe pressure testing certificates, acoustic decibel readings and air filtration schedule.",
      date: "21 Sep 2026",
      downloadUrl: "#"
    }
  ],

  // Recent Drawing Submissions (for Admin Overview)
  recentSubmissions: [
    {
      id: "sub-1",
      title: "Kitchen Layout & Joinery Details",
      rev: "LATEST REVISION",
      revClass: "badge-current",
      detail: "Rev 04 - Kapoor Villa, Alibaug • Millwork & Island Detailing",
      meta: "UPLOADED 2H AGO BY ATELIER STUDIO 01",
      sheetId: "drw-k201"
    },
    {
      id: "sub-2",
      title: "Floor Plan — Master Suite & Terrace",
      rev: "REV 03 APPROVED",
      revClass: "badge-approved",
      detail: "Sharma Residence, 4BHK Juhu • Structural Partitioning Complete",
      meta: "UPLOADED 5H AGO BY SENIOR ARCHITECT",
      sheetId: "drw-a101"
    },
    {
      id: "sub-3",
      title: "Electrical & Lighting Layout Schedule",
      rev: "UNDER REVIEW",
      revClass: "badge-review",
      detail: "Mehta Apartment, Bandra • Dimming Zones & Automation Hub",
      meta: "UPLOADED YESTERDAY BY MEP CONSULTANT",
      sheetId: "drw-e301"
    }
  ]
};

// Export to window
window.ATELIER_DATA = ATELIER_DATA;
