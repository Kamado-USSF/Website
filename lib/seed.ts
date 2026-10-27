/**
 * Inlined copy of data/ussf-database.json for serverless bundling.
 *
 * Vercel function bundles do not include data JSON files at runtime, so the
 * seed must be plain code inside the bundle. Regenerate this file whenever
 * data/ussf-database.json changes: wrap that file unchanged after
 * "export const USSF_SEED: Record<string, unknown> = ".
 */
export const USSF_SEED: Record<string, unknown> = {
  "version": 1,
  "lastUpdated": "2026-10-26T07:21:02.183Z",
  "members": [
    {
      "id": "admin-kamado",
      "cid": "SF-001",
      "name": "Kamado",
      "accountName": "Kamado",
      "callsign": "SLT-Kamado#USSF",
      "rank": "High Commander",
      "rankLevel": 20,
      "rankCategory": "High Command",
      "division": "USSF High Command Leadership",
      "joinedDate": "2019-06-30",
      "status": "Active Duty",
      "presenceStatus": "Online",
      "isOnlineCit": true,
      "promotionPoints": 5500,
      "totalPayout": 150000000,
      "arrestCount": 4820,
      "patrolHours": 420,
      "playtimeHours": 1250,
      "country": "San Andreas",
      "age": 26,
      "birthday": "March 15",
      "serviceRibbons": [
        "Founding High Commander",
        "Supreme Medal of Honor",
        "Distinguished Service Cross",
        "Tactical Operations Ribbon"
      ],
      "avatarUrl": "/src/assets/images/military_leader_training_1790341999734.jpg",
      "avatarFrame": "Supreme Gold Aureole",
      "namecard": "Crimson Apex Seal",
      "nameStyle": "crimson-apex",
      "bio": "High Commander & Group Leader of Special Forces [USSF]. Directing strategic tactical operations, personnel management, and CIT2 law enforcement.",
      "signature": "May God Have Mercy Upon Our Enemies Cause We Won't",
      "customCursor": "solo-leveling",
      "isMember": true,
      "isAdmin": true,
      "isOwner": true,
      "isApplicant": false,
      "specialRoles": [
        "Administrator",
        "Promotion Manager",
        "Financial Manager",
        "Account Recovery Manager"
      ]
    }
  ],
  "fieldReports": [],
  "claims": [],
  "rewardCatalog": [
    {
      "id": "rew-ap-1",
      "category": "Arrest Points",
      "title": "5,000 Arrest Points",
      "payoutAmount": 750000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock (B+Clock). Daily claim only."
    },
    {
      "id": "rew-ap-2",
      "category": "Arrest Points",
      "title": "10,000 Arrest Points",
      "payoutAmount": 2250000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock. Daily claim only."
    },
    {
      "id": "rew-ap-3",
      "category": "Arrest Points",
      "title": "20,000 Arrest Points",
      "payoutAmount": 4500000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock. Daily claim only."
    },
    {
      "id": "rew-ap-4",
      "category": "Arrest Points",
      "title": "30,000 Arrest Points",
      "payoutAmount": 7500000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock. Daily claim only."
    },
    {
      "id": "rew-ap-5",
      "category": "Arrest Points",
      "title": "40,000 Arrest Points",
      "payoutAmount": 12000000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock. Daily claim only."
    },
    {
      "id": "rew-ap-6",
      "category": "Arrest Points",
      "title": "60,000 Arrest Points",
      "payoutAmount": 25000000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock. Daily claim only."
    },
    {
      "id": "rew-ap-7",
      "category": "Arrest Points",
      "title": "85,000 Arrest Points",
      "payoutAmount": 38000000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock. Daily claim only."
    },
    {
      "id": "rew-ap-8",
      "category": "Arrest Points",
      "title": "100,000 Arrest Points",
      "payoutAmount": 50000000,
      "frequency": "DAILY",
      "description": "Show F5 scores or Group Scores and unedited phone clock. Daily claim only."
    },
    {
      "id": "rew-pt-1",
      "category": "Patrol & Training",
      "title": "Participate in a Patrol / Training",
      "payoutAmount": 500000,
      "frequency": "WEEKLY",
      "description": "Provide verified event screenshot proof and phone clock."
    },
    {
      "id": "rew-pt-2",
      "category": "Patrol & Training",
      "title": "Host a Quality Patrol / Training (SGM+)",
      "payoutAmount": 1000000,
      "frequency": "WEEKLY",
      "description": "Must be Sergeant Major rank or higher. Provide start/end log and proof."
    },
    {
      "id": "rew-pt-3",
      "category": "Patrol & Training",
      "title": "Participate in 3 Patrols / Trainings (Weekly)",
      "payoutAmount": 2000000,
      "frequency": "WEEKLY",
      "description": "Weekly milestone: 3 verified sessions. Resets each Monday."
    },
    {
      "id": "rew-pt-4",
      "category": "Patrol & Training",
      "title": "Host 3 Quality Patrols / Trainings (Weekly)",
      "payoutAmount": 5000000,
      "frequency": "WEEKLY",
      "description": "Weekly host milestone: 3 quality sessions led. Resets each Monday."
    },
    {
      "id": "rew-pt-5",
      "category": "Patrol & Training",
      "title": "Participate in 5 Patrols / Trainings (Weekly)",
      "payoutAmount": 5000000,
      "frequency": "WEEKLY",
      "description": "Weekly elite milestone: 5 verified patrol sessions."
    },
    {
      "id": "rew-pt-6",
      "category": "Patrol & Training",
      "title": "Host 5 Quality Patrols / Trainings (Weekly)",
      "payoutAmount": 7000000,
      "frequency": "WEEKLY",
      "description": "Weekly commander milestone: 5 quality sessions hosted. Maximum weekly allowance."
    },
    {
      "id": "rew-ct-1",
      "category": "Combat & Tactical",
      "title": "Arrest any criminal with Bounty Blip",
      "payoutAmount": 1000000,
      "frequency": "MULTI_DAILY",
      "allowQuantity": true,
      "description": "Show bounty blip on map and successful arrest. Enter quantity to multiply reward payout."
    },
    {
      "id": "rew-ct-2",
      "category": "Combat & Tactical",
      "title": "Kill & Arrest any APB",
      "payoutAmount": 2000000,
      "frequency": "MULTI_DAILY",
      "allowQuantity": true,
      "description": "Show APB notification/clearing proof. Enter quantity to multiply reward payout."
    },
    {
      "id": "rew-ct-3",
      "category": "Combat & Tactical",
      "title": "4 Kill Arrests at one AR / CE",
      "payoutAmount": 700000,
      "frequency": "MULTI_DAILY",
      "allowQuantity": true,
      "description": "Show event log showing 4 kill arrests during single AR/CE. Enter count to multiply."
    },
    {
      "id": "rew-ct-4",
      "category": "Combat & Tactical",
      "title": "Deal 2,000+ Damage in one AR / CE",
      "payoutAmount": 800000,
      "frequency": "MULTI_DAILY",
      "allowQuantity": true,
      "description": "Show damage pool proof and phone clock. Enter quantity to multiply reward payout."
    },
    {
      "id": "rew-dt-1",
      "category": "Daily & Specialist Tasks",
      "title": "Top Cop of the Day",
      "payoutAmount": 2000000,
      "frequency": "DAILY",
      "description": "Show daily reset and phone clock. Must have been in USSF when earned."
    },
    {
      "id": "rew-dt-2",
      "category": "Daily & Specialist Tasks",
      "title": "Top Bomb Disposal of the Day",
      "payoutAmount": 2000000,
      "frequency": "DAILY",
      "description": "Show daily reset scoreboard and phone clock."
    },
    {
      "id": "rew-dt-3",
      "category": "Daily & Specialist Tasks",
      "title": "Top Detective of the Day",
      "payoutAmount": 2000000,
      "frequency": "DAILY",
      "description": "Show daily reset detective ranking and phone clock."
    },
    {
      "id": "rew-dt-4",
      "category": "Daily & Specialist Tasks",
      "title": "Defuse 30 Bombs",
      "payoutAmount": 2000000,
      "frequency": "DAILY",
      "description": "Show verified bomb disposal proof and phone clock."
    },
    {
      "id": "rew-dt-5",
      "category": "Daily & Specialist Tasks",
      "title": "Defuse 50 Bombs",
      "payoutAmount": 2000000,
      "frequency": "DAILY",
      "description": "Show verified bomb disposal proof and phone clock."
    },
    {
      "id": "rew-dt-6",
      "category": "Daily & Specialist Tasks",
      "title": "Solve 15 Detective Cases",
      "payoutAmount": 2000000,
      "frequency": "DAILY",
      "description": "Show detective cases solved log and phone clock."
    },
    {
      "id": "rew-dt-7",
      "category": "Daily & Specialist Tasks",
      "title": "Solve 30 Detective Cases",
      "payoutAmount": 2000000,
      "frequency": "DAILY",
      "description": "Show detective cases solved log and phone clock."
    },
    {
      "id": "rew-pa-1",
      "category": "Promotions & Achievements",
      "title": "Junior Commissioned Officer (JCM) Ranks",
      "payoutAmount": 3000000,
      "frequency": "ONCE_ONLY",
      "description": "Claimable once in service. Promotion evidence required."
    },
    {
      "id": "rew-pa-2",
      "category": "Promotions & Achievements",
      "title": "Regular Commissioned Officer (RCM) Ranks",
      "payoutAmount": 7000000,
      "frequency": "ONCE_ONLY",
      "description": "Claimable once in service. Promotion evidence required."
    },
    {
      "id": "rew-pa-3",
      "category": "Promotions & Achievements",
      "title": "Senior Commissioned Officer (SCM) Ranks",
      "payoutAmount": 15000000,
      "frequency": "ONCE_ONLY",
      "description": "Claimable once in service. Promotion evidence required."
    },
    {
      "id": "rew-pa-4",
      "category": "Promotions & Achievements",
      "title": "Major Promotion (SFC to FMJR)",
      "payoutAmount": 30000000,
      "frequency": "ONCE_ONLY",
      "description": "Milestone promotion award: Sergeant First Class to Field Major. Once only."
    },
    {
      "id": "rew-pa-5",
      "category": "Promotions & Achievements",
      "title": "Command Promotion (CSM to VCMD)",
      "payoutAmount": 50000000,
      "frequency": "ONCE_ONLY",
      "description": "Elite promotion: Command Sergeant Major to Vice Commander. Once only."
    },
    {
      "id": "rew-pa-6",
      "category": "Promotions & Achievements",
      "title": "Special Operator of the Month",
      "payoutAmount": 80000000,
      "frequency": "MONTHLY",
      "description": "Awarded to top monthly operator. Resets on 1st of every month."
    }
  ],
  "socialPosts": [],
  "dms": [],
  "linkRequests": [],
  "applications": [],
  "forgotPwRequests": [],
  "adminEvents": [
    {
      "id": "evt-1",
      "title": "STANDARD OPERATIONS: 1X TREASURY PAYOUTS",
      "multiplierType": "1X Financial Payouts",
      "multiplier": 1,
      "startDate": "2026-09-29",
      "endDate": "2026-12-31",
      "isActive": true,
      "announcement": "Official USSF standard financial payouts active. Claim verified arrest points and patrol milestones."
    }
  ],
  "loginRewards": [
    {
      "day": 1,
      "cashAmount": 500000,
      "promotionPoints": 25,
      "label": "$500,000 Cash + 25 Points",
      "icon": "DollarSign"
    },
    {
      "day": 2,
      "cashAmount": 1000000,
      "promotionPoints": 50,
      "label": "$1,000,000 Cash + 50 Points",
      "icon": "DollarSign"
    },
    {
      "day": 3,
      "cashAmount": 1500000,
      "promotionPoints": 75,
      "label": "$1,500,000 Cash + 75 Points",
      "icon": "DollarSign"
    },
    {
      "day": 4,
      "cashAmount": 2000000,
      "promotionPoints": 100,
      "label": "$2,000,000 Cash + 100 Points",
      "icon": "DollarSign"
    },
    {
      "day": 5,
      "cashAmount": 3000000,
      "promotionPoints": 150,
      "label": "$3,000,000 Cash + 150 Points",
      "icon": "DollarSign"
    },
    {
      "day": 6,
      "cashAmount": 5000000,
      "promotionPoints": 200,
      "label": "$5,000,000 Cash + 200 Points",
      "icon": "DollarSign"
    },
    {
      "day": 7,
      "cashAmount": 10000000,
      "promotionPoints": 500,
      "label": "$10,000,000 Cash + 500 Points",
      "icon": "DollarSign"
    }
  ],
  "pendingLoginClaims": [],
  "promotionRequests": [],
  "groupInfo": {
    "name": "Special Forces",
    "shortName": "USSF",
    "level": "L4",
    "founder": "HCMD-OneManArmy#USSF",
    "coFounder": "HCMD-Meliodas#USSF",
    "commander": "SCMD-Caminade#USSF",
    "leaders": "SCMD-Caminade#USSF, SLT-Kamado#USSF",
    "activeSince": "2019-06-30",
    "tagUsage": "RANK-Name#USSF",
    "commandCenters": "N/A",
    "skinsAvailable": [
      "39",
      "164",
      "267",
      "285",
      "286",
      "287",
      "266",
      "1017",
      "1016",
      "1007",
      "1057"
    ],
    "carShadersAvailable": [
      "Sultan",
      "Burrito",
      "Banshee",
      "Hydra",
      "Hummer"
    ],
    "motto": "May God Have Mercy Upon Our Enemies Cause We Won't",
    "organizationColor": "R: 0 G: 0 B: 0",
    "hexColor": "#000000",
    "alliance": "None",
    "type": "Law Enforcement Police Force Group (CIT2 Law Group)",
    "doctrinalMissions": [
      "Unconventional Warfare",
      "Foreign Internal Defense",
      "Direct Action",
      "Counter-Insurgency",
      "Special Reconnaissance",
      "Counter-Terrorism",
      "Information Operations",
      "Counterproliferation of Weapons of Mass Destruction (WMD)",
      "Security Force Assistance"
    ],
    "otherDuties": [
      "Combat Search and Rescue (CSAR)",
      "Counter-Narcotics",
      "Hostage Rescue",
      "Humanitarian Assistance",
      "Humanitarian Demining",
      "Peacekeeping",
      "Psychological Operations",
      "APB & Felon Manhunts"
    ],
    "acceptanceRate": "10% Selection Pass Rate",
    "operatingTheaters": "Los Santos & Las Venturas (Ground, Sea, Air)"
  },
  "birthdayGifts": [],
  "squadGroups": [],
  "achievements": [],
  "customAssets": [
    {
      "id": "skin-39",
      "type": "SKIN",
      "title": "Skin ID 39 (Standard Elite Special Forces)",
      "codeOrId": "Skin ID 39",
      "variantCount": 4,
      "imageUrl": "/src/assets/images/special_forces_unit_1790346782492.jpg",
      "description": "Primary Special Forces combat fatigue uniform with 4 tactical variants: Urban CQB, Desert Camouflage, Night Infiltration, and Tactical Recon.",
      "category": "Special Forces"
    },
    {
      "id": "skin-164",
      "type": "SKIN",
      "title": "Skin ID 164 (Tactical Bouncer SpecOps)",
      "codeOrId": "Skin ID 164",
      "variantCount": 2,
      "imageUrl": "/src/assets/images/military_leader_training_1790341999734.jpg",
      "description": "Heavy armor tactical assault uniform with reinforced plate carrier and ballistic helmet.",
      "category": "Infantry"
    },
    {
      "id": "skin-285",
      "type": "SKIN",
      "title": "Skin ID 285 (SWAT Tactical Commander)",
      "codeOrId": "Skin ID 285",
      "variantCount": 3,
      "imageUrl": "/src/assets/images/hero_night_raid_1790347363090.jpg",
      "description": "High Command tactical dress uniform with beret and radio comms harness.",
      "category": "Command"
    },
    {
      "id": "skin-287",
      "type": "SKIN",
      "title": "Skin ID 287 (Army Desert Recon)",
      "codeOrId": "Skin ID 287",
      "variantCount": 2,
      "imageUrl": "/src/assets/images/hero_tactical_desert_1790341915780.jpg",
      "description": "Desert digital camouflage long-range patrol uniform.",
      "category": "Special Forces"
    },
    {
      "id": "shader-sultan",
      "type": "VEHICLE_SHADER",
      "title": "Sultan Tactical Police Shader",
      "codeOrId": "Sultan Shader #01",
      "variantCount": 1,
      "imageUrl": "/src/assets/images/hero_morning_patrol_1790422704024.jpg",
      "description": "High-speed interceptor livery featuring high-visibility reflective battenburg and USSF law group seal.",
      "category": "Vehicle"
    },
    {
      "id": "shader-hydra",
      "type": "VEHICLE_SHADER",
      "title": "Hydra Fighter Air Defense Shader",
      "codeOrId": "Hydra Shader #04",
      "variantCount": 1,
      "imageUrl": "/src/assets/images/combined_arms_assault_1790348050560.jpg",
      "description": "Matte stealth grey air superiority shader with low-observable USSF roundel.",
      "category": "Vehicle"
    },
    {
      "id": "shader-hummer",
      "type": "VEHICLE_SHADER",
      "title": "Patriot 50-Cal Gun-Truck Shader",
      "codeOrId": "Patriot Shader #02",
      "variantCount": 1,
      "imageUrl": "/src/assets/images/hero_tactical_desert_1790341915780.jpg",
      "description": "Desert sand armored gun-truck livery with reinforced bull-bars and thermal searchlights.",
      "category": "Vehicle"
    }
  ],
  "milestoneChoices": [
    {
      "id": "choice-7-cursor",
      "milestoneDay": 7,
      "type": "CUSTOM_CURSOR",
      "title": "Custom Cursor: Solo Leveling Shadow Monarch",
      "description": "Equip the exclusive dark obsidian shadow dagger and purple monarch flame hand pointer across the site.",
      "rewardValue": "solo-leveling",
      "previewImage": "/assets/aistudio/Solo_Leveling_Shadow_Arrow___Monarch_Hand_Animated_Cursor--cursor--SweezyCursors_493f92f5.png"
    },
    {
      "id": "choice-7-namecard",
      "milestoneDay": 7,
      "type": "NAMECARD",
      "title": "Custom Namecard Banner",
      "description": "Equip an exclusive animated or aesthetic namecard theme (e.g. Changli: Blazing Vermilion Phoenix).",
      "rewardValue": "Changli: Blazing Vermilion Phoenix"
    },
    {
      "id": "choice-7-frame",
      "milestoneDay": 7,
      "type": "AVATAR_FRAME",
      "title": "Specialist Diamond Avatar Frame",
      "description": "Equip the glowing Specialist Diamond border around your tactical operator avatar.",
      "rewardValue": "Specialist Diamond"
    },
    {
      "id": "choice-7-cash",
      "milestoneDay": 7,
      "type": "CASH_POINTS",
      "title": "Treasury Cash & Points Jackpot",
      "description": "Claim $5,000,000 cash bonus + 50 Promotion Points disbursed to your career ledger.",
      "rewardValue": "$5,000,000 + 50 Pts",
      "cashAmount": 5000000,
      "promotionPoints": 50
    },
    {
      "id": "choice-7-title",
      "milestoneDay": 7,
      "type": "TITLE",
      "title": "Commendation Title: \"Ironclad Vanguard\"",
      "description": "Display an official prestigious title above your rank on your dossier and roster profile.",
      "rewardValue": "Ironclad Vanguard"
    },
    {
      "id": "choice-30-cursor",
      "milestoneDay": 30,
      "type": "CUSTOM_CURSOR",
      "title": "Custom Cursor: Halo Energy Sword",
      "description": "Equip the legendary plasma dual energy blade with electric blue corona across all pages.",
      "rewardValue": "halo-sword",
      "previewImage": "/assets/aistudio/Halo_Energy_Sword_Cursor--cursor--SweezyCursors_8d5744aa.png"
    },
    {
      "id": "choice-30-namecard",
      "milestoneDay": 30,
      "type": "NAMECARD",
      "title": "Supreme Archon Namecard Banner",
      "description": "Equip the Ultra Prestige \"Raiden Shogun: Electro Eternity\" namecard banner.",
      "rewardValue": "Raiden Shogun: Electro Eternity"
    },
    {
      "id": "choice-30-frame",
      "milestoneDay": 30,
      "type": "AVATAR_FRAME",
      "title": "Supreme Gold Aureole Frame",
      "description": "Equip the highest echelon Supreme Gold Aureole border with radiant golden aura.",
      "rewardValue": "Supreme Gold Aureole"
    },
    {
      "id": "choice-30-cash",
      "milestoneDay": 30,
      "type": "CASH_POINTS",
      "title": "Supreme Monthly Treasury Jackpot",
      "description": "Disburse $25,000,000 cash bonus + 200 Promotion Points to your career balance.",
      "rewardValue": "$25,000,000 + 200 Pts",
      "cashAmount": 25000000,
      "promotionPoints": 200
    },
    {
      "id": "choice-30-title",
      "milestoneDay": 30,
      "type": "TITLE",
      "title": "Supreme Commendation Title: \"Grand Marshal of the Citadel\"",
      "description": "Endow your dossier with the highest 30-day active duty title in CIT2 Special Forces history.",
      "rewardValue": "Grand Marshal of the Citadel"
    }
  ]
};
