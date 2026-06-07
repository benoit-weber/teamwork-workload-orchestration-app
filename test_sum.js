const csv = `ID,Date,Date/time,End date/time,Project,Who,Description,Project category,Company,Is it billable?,Decimal hours,Estimated time,Estimated time (Hours),Estimated time (Minutes),Tags,Task tags,First name,Last name,User ID,Task ID
25309842,05/05/2026,05/05/2026 07:00,05/05/2026 07:30,[EGC] Experience Gold Coast | SEO,Benoit Weber,Regroup with Selina on deck,Growth,Destination Gold Coast,1,0.5,180,3,0,,,Benoit,Weber,208594,43690522
25309897,05/05/2026,05/05/2026 09:00,05/05/2026 10:00,[EGC] Experience Gold Coast | SEO,Benoit Weber,Deck prep,Growth,Destination Gold Coast,1,1,180,3,0,,,Benoit,Weber,208594,43690522
25318961,06/05/2026,06/05/2026 12:00,06/05/2026 13:00,[EGC] Experience Gold Coast | SEO,Benoit Weber,Prep and discussion with Selina,Growth,Destination Gold Coast,1,1,180,3,0,,,Benoit,Weber,208594,43690522
25318966,07/05/2026,07/05/2026 07:00,07/05/2026 11:00,[EGC] Experience Gold Coast | SEO,Benoit Weber,Prep + Meeting,Growth,Destination Gold Coast,1,4,180,3,0,,,Benoit,Weber,208594,43690522
25368533,20/05/2026,20/05/2026 09:00,20/05/2026 09:45,[EGC] Experience Gold Coast | SEO,Benoit Weber,meeting with team + perep,Growth,Destination Gold Coast,1,0.75,360,6,0,,,Benoit,Weber,208594,43690518
25409766,03/06/2026,03/06/2026 06:45,03/06/2026 07:15,[EGC] Experience Gold Coast | SEO,Benoit Weber,WIP,Growth,Destination Gold Coast,1,0.5,60,1,0,,,Benoit,Weber,208594,43690526
25419955,05/06/2026,05/06/2026 08:00,05/06/2026 08:30,[EGC] Experience Gold Coast | SEO,Benoit Weber,WIP,Growth,Destination Gold Coast,1,0.5,60,1,0,,,Benoit,Weber,208594,43690526
25354686,18/05/2026,18/05/2026 09:15,18/05/2026 09:45,[DLT] Doltone Hospitality Group | Paid Media,Benoit Weber,Tracking Review,Growth,Doltone Hospitality,1,0.5,120,2,0,,,Benoit,Weber,208594,44603706
25394186,29/05/2026,29/05/2026 11:15,29/05/2026 11:45,[DLT] Doltone Hospitality Group | Paid Media,Benoit Weber,CMP questions / Review,Growth,Doltone Hospitality,1,0.5,0,0,0,,,Benoit,Weber,208594,44603707
25409853,03/06/2026,03/06/2026 11:15,03/06/2026 13:00,[DLT] Doltone Hospitality Group | Paid Media,Benoit Weber,Meeting x 2 + Prep,Growth,Doltone Hospitality,1,1.75,120,2,0,,,Benoit,Weber,208594,44603706
25314048,04/05/2026,04/05/2026 06:00,04/05/2026 08:00,[INM] Operations,Benoit Weber,Church Point - Sydney,Internal - OPX Standard,In Marketing We Trust,0,2,1800,30,0,,,Benoit,Weber,208594,44520156
25309466,04/05/2026,04/05/2026 12:00,04/05/2026 14:00,[INM] Sales,Benoit Weber,Doltone Meeting,Internal - OPX Standard,In Marketing We Trust,0,2,0,0,0,,,Benoit,Weber,208594,42456353
25309469,04/05/2026,04/05/2026 14:00,04/05/2026 16:00,[INM] Operations,Benoit Weber,"General ops, discussions with Paul, emails",Internal - OPX Standard,In Marketing We Trust,0,2,0,0,0,,,Benoit,Weber,208594,42476393
25309472,05/05/2026,05/05/2026 08:00,05/05/2026 09:00,[INM] Operations,Benoit Weber,Privacy framework,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25314052,05/05/2026,05/05/2026 10:00,05/05/2026 11:00,[INM] Operations,Benoit Weber,Churchr point,Internal - OPX Standard,In Marketing We Trust,0,1,1800,30,0,,,Benoit,Weber,208594,44520156
25314046,05/05/2026,05/05/2026 11:00,05/05/2026 16:00,[INM] Operations,Benoit Weber,Sydney - Brisbane,Internal - OPX Standard,In Marketing We Trust,0,5,1800,30,0,,,Benoit,Weber,208594,44520156
25318958,06/05/2026,06/05/2026 08:00,06/05/2026 09:30,[INM] Operations,Benoit Weber,Isuzu + infochoice transport (3x30min),Internal - OPX Standard,In Marketing We Trust,0,1.5,1800,30,0,,,Benoit,Weber,208594,44520156
25318960,06/05/2026,06/05/2026 11:00,06/05/2026 12:00,[INM] Sales,Benoit Weber,Infochoice,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42456353
25318965,07/05/2026,07/05/2026 03:30,07/05/2026 07:00,[INM] Operations,Benoit Weber,Brisbane > GC > Brisbane,Internal - OPX Standard,In Marketing We Trust,0,3.5,1800,30,0,,,Benoit,Weber,208594,44520156
25323161,07/05/2026,07/05/2026 12:30,07/05/2026 14:00,[INM] Operations,Benoit Weber,AI meeting + General ops,Internal - OPX Standard,In Marketing We Trust,0,1.5,0,0,0,,,Benoit,Weber,208594,42476393
25323157,08/05/2026,08/05/2026 03:45,08/05/2026 04:30,[INM] Operations,Benoit Weber,"general ops, slack, email",Internal - OPX Standard,In Marketing We Trust,0,0.75,0,0,0,,,Benoit,Weber,208594,42476393
25323365,08/05/2026,08/05/2026 09:15,08/05/2026 10:30,[INM] Operations,Benoit Weber,FYI Prep + meeting,Internal - OPX Standard,In Marketing We Trust,0,1.25,0,0,0,,,Benoit,Weber,208594,42476393
25337990,11/05/2026,11/05/2026 07:15,11/05/2026 13:15,[INM] Operations,Benoit Weber,Leadership workshop,Internal - OPX Standard,In Marketing We Trust,0,6,1800,30,0,,,Benoit,Weber,208594,44520156
25337992,11/05/2026,11/05/2026 13:15,11/05/2026 18:15,[INM] Operations,Benoit Weber,Brisbane > Melbourne,Internal - OPX Standard,In Marketing We Trust,0,5,1800,30,0,,,Benoit,Weber,208594,44520156
25338000,12/05/2026,12/05/2026 10:00,12/05/2026 14:00,[INM] Operations,Benoit Weber,Meetings x 2 + Transport,Internal - OPX Standard,In Marketing We Trust,0,4,,,,,,Benoit,Weber,208594,
25338003,13/05/2026,13/05/2026 07:00,13/05/2026 12:00,[INM] Operations,Benoit Weber,Melbourne > Sydney,Internal - OPX Standard,In Marketing We Trust,0,5,1800,30,0,,,Benoit,Weber,208594,44520156
25338009,13/05/2026,13/05/2026 12:00,13/05/2026 16:00,[INM] Marketing,Benoit Weber,Analytics Wednesday (Event + Prep),Internal - OPX Invest,In Marketing We Trust,0,4,0,0,0,,,Benoit,Weber,208594,44586102
25343743,13/05/2026,13/05/2026 16:00,13/05/2026 18:00,[INM] Operations,Benoit Weber,"Discussion with Freddy (360 Suite, IMWT, AI...)",Internal - OPX Standard,In Marketing We Trust,0,2,1800,30,0,,,Benoit,Weber,208594,44520156
25354680,14/05/2026,14/05/2026 09:00,14/05/2026 12:00,[INM] Operations,Benoit Weber,lunch with Freddy + Lou + Transport,Internal - OPX Standard,In Marketing We Trust,0,3,0,0,0,,,Benoit,Weber,208594,42476393
25343744,15/05/2026,15/05/2026 07:00,15/05/2026 13:00,[INM] Operations,Benoit Weber,Lily Catchup on 360 Suite,Internal - OPX Standard,In Marketing We Trust,0,6,1800,30,0,,,Benoit,Weber,208594,44520156
25354678,15/05/2026,15/05/2026 13:00,15/05/2026 15:00,[INM] Operations,Benoit Weber,catchup with Freddy,Internal - OPX Standard,In Marketing We Trust,0,2,0,0,0,,,Benoit,Weber,208594,42476393
25338019,18/05/2026,18/05/2026 07:00,18/05/2026 21:00,[INM] Operations,Benoit Weber,Sydney > Hanoi,Internal - OPX Standard,In Marketing We Trust,0,14,1800,30,0,,,Benoit,Weber,208594,44520156
25354684,18/05/2026,18/05/2026 08:00,18/05/2026 09:00,[INM] Operations,Benoit Weber,general ops,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25359147,19/05/2026,19/05/2026 07:45,19/05/2026 08:45,[INM] Operations,Benoit Weber,general ops,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25363919,19/05/2026,19/05/2026 08:45,19/05/2026 11:00,[INM] Operations,Benoit Weber,workload tool,Internal - OPX Standard,In Marketing We Trust,0,2.25,0,0,0,,,Benoit,Weber,208594,42476393
25363921,19/05/2026,19/05/2026 12:00,19/05/2026 13:00,[INM] Operations,Benoit Weber,discussion with Freddy,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25363924,19/05/2026,19/05/2026 13:00,19/05/2026 13:30,[INM] Marketing,Benoit Weber,tracking for training site,Internal - OPX Invest,In Marketing We Trust,0,0.5,0,0,0,,,Benoit,Weber,208594,44616636
25368532,20/05/2026,20/05/2026 08:00,20/05/2026 09:00,[INM] Operations,Benoit Weber,trafficking + general ops,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25368535,21/05/2026,21/05/2026 08:30,21/05/2026 09:30,[INM] Operations,Benoit Weber,general ops,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25368536,21/05/2026,21/05/2026 09:30,21/05/2026 10:00,[INM] Operations,Benoit Weber,interview / catchup with Andrew,Internal - OPX Standard,In Marketing We Trust,0,0.5,0,0,0,,,Benoit,Weber,208594,42476393
25379450,26/05/2026,26/05/2026 10:15,26/05/2026 12:00,[INM] Operations,Benoit Weber,leadership meeting + general ops,Internal - OPX Standard,In Marketing We Trust,0,1.75,,,,,,Benoit,Weber,208594,
25379794,26/05/2026,26/05/2026 12:00,26/05/2026 13:15,[INM] Operations,Benoit Weber,121 with Selina,Internal - OPX Standard,In Marketing We Trust,0,1.25,0,0,0,,,Benoit,Weber,208594,42476393
25384883,27/05/2026,27/05/2026 11:45,27/05/2026 13:00,[INM] Operations,Benoit Weber,Trafficking Meeting + daily huddle,Internal - OPX Standard,In Marketing We Trust,0,1.25,0,0,0,,,Benoit,Weber,208594,42476393
25384886,27/05/2026,27/05/2026 14:00,27/05/2026 15:00,[INM] Operations,Benoit Weber,"general ops, emails, slack",Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25385018,27/05/2026,27/05/2026 15:00,27/05/2026 16:00,[INM] Operations,Benoit Weber,GTM Tag Renamer,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25389521,28/05/2026,28/05/2026 08:00,28/05/2026 09:00,[INM] Operations,Benoit Weber,general ops,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25389829,28/05/2026,28/05/2026 14:30,28/05/2026 15:00,[INM] Operations,Benoit Weber,artefact for privacy,Internal - OPX Standard,In Marketing We Trust,0,0.5,0,0,0,,,Benoit,Weber,208594,42476393
25394127,29/05/2026,29/05/2026 07:45,29/05/2026 09:00,[INM] People Management,Benoit Weber,"Interview (prep, interview and debrief)",Internal - OPX Standard,In Marketing We Trust,0,1.25,0,0,0,,,Benoit,Weber,208594,24992697
25394130,29/05/2026,29/05/2026 10:00,29/05/2026 11:15,[INM] Operations,Benoit Weber,general ops,Internal - OPX Standard,In Marketing We Trust,0,1.25,0,0,0,,,Benoit,Weber,208594,42476393
25399955,01/06/2026,01/06/2026 13:00,01/06/2026 14:30,[INM] Operations,Benoit Weber,general ops and daily huddle,Internal - OPX Standard,In Marketing We Trust,0,1.5,0,0,0,,,Benoit,Weber,208594,42476393
25400309,01/06/2026,01/06/2026 14:30,01/06/2026 15:00,[INM] Operations,Benoit Weber,workload discussion with Andrei,Internal - OPX Standard,In Marketing We Trust,0,0.5,0,0,0,,,Benoit,Weber,208594,42476393
25404834,02/06/2026,02/06/2026 07:57,02/06/2026 08:57,[INM] Operations,Benoit Weber,"general ops, emaiol, slack + prep for leadership",Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25404880,02/06/2026,02/06/2026 09:00,02/06/2026 10:00,[INM] Operations,Benoit Weber,leadership team,Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25405322,02/06/2026,02/06/2026 14:15,02/06/2026 17:00,[INM] Operations,Benoit Weber,121 with Barbara + 121 with Yine + daily huddle 30min,Internal - OPX Standard,In Marketing We Trust,0,2.75,,,,,,Benoit,Weber,208594,
25409765,03/06/2026,03/06/2026 07:15,03/06/2026 10:45,[INM] Operations,Benoit Weber,D360 (1h30)+ Trafficking (30) + general ops (1) + daily huddle x 2,Internal - OPX Standard,In Marketing We Trust,0,3.5,0,0,0,,,Benoit,Weber,208594,42476393
25414398,04/06/2026,04/06/2026 07:00,04/06/2026 08:00,[INM] Operations,Benoit Weber,"email, slack, general updates",Internal - OPX Standard,In Marketing We Trust,0,1,0,0,0,,,Benoit,Weber,208594,42476393
25419952,04/06/2026,04/06/2026 13:00,04/06/2026 13:45,[INM] Operations,Benoit Weber,AI meeting + huddle + call wigth Andrew,Internal - OPX Standard,In Marketing We Trust,0,0.75,0,0,0,,,Benoit,Weber,208594,42476393
25419961,05/06/2026,05/06/2026 10:30,05/06/2026 12:45,[INM] Operations,Benoit Weber,FYI + Prep + geneal ops,Internal - OPX Standard,In Marketing We Trust,0,2.25,0,0,0,,,Benoit,Weber,208594,42476393
25423697,07/06/2026,07/06/2026 07:15,07/06/2026 11:15,[INM] Operations,Benoit Weber,Workload App,Internal - OPX Standard,In Marketing We Trust,0,4,0,0,0,,,Benoit,Weber,208594,42476393
25314059,05/05/2026,05/05/2026 16:15,05/05/2026 16:45,[ISZ] Isuzu | Analytics | Adhoc Support,Benoit Weber,support to Maine,Measure,Isuzu,1,0.5,600,10,0,,,Benoit,Weber,208594,44319612
25314636,06/05/2026,06/05/2026 04:25,06/05/2026 04:45,[ISZ] Isuzu | Analytics | Adhoc Support,Benoit Weber,review of deck,Measure,Isuzu,1,0.333,,,,,,Benoit,Weber,208594,
25318954,06/05/2026,06/05/2026 09:00,06/05/2026 11:00,[ISZ] Isuzu | Analytics | Adhoc Support,Benoit Weber,Meeting + Lunch,Measure,Isuzu,1,2,600,10,0,,,Benoit,Weber,208594,44319612
25384882,27/05/2026,27/05/2026 07:38,27/05/2026 11:38,[ISZ] Isuzu | Analytics | Adhoc Support,Benoit Weber,Consent Update,Measure,Isuzu,1,4,0,0,0,,,Benoit,Weber,208594,44643854
25384884,27/05/2026,27/05/2026 13:00,27/05/2026 13:30,[ISZ] Isuzu | Analytics | Adhoc Support,Benoit Weber,WIP with client,Measure,Isuzu,1,0.5,600,10,0,,,Benoit,Weber,208594,44319612
25405320,02/06/2026,02/06/2026 10:30,02/06/2026 10:45,[ISZ] Isuzu | Analytics | Adhoc Support,Benoit Weber,scrum,Measure,Isuzu,1,0.25,600,10,0,,,Benoit,Weber,208594,44398438
25414396,04/06/2026,04/06/2026 07:45,04/06/2026 08:00,[ISZ] Isuzu | Analytics | Adhoc Support,Benoit Weber,check signals,Measure,Isuzu,1,0.25,600,10,0,,,Benoit,Weber,208594,44398438
25377063,21/05/2026,21/05/2026 10:00,21/05/2026 14:00,[KNN] Kennards | Analytics | Project,Benoit Weber,Audit part 1,Measure,Kennards,1,4,480,8,0,,,Benoit,Weber,208594,44610556
25379795,26/05/2026,26/05/2026 13:15,26/05/2026 16:00,[KNN] Kennards | Analytics | Project,Benoit Weber,audit,Measure,Kennards,1,2.75,,,,,,Benoit,Weber,208594,
25389680,28/05/2026,28/05/2026 12:00,28/05/2026 13:00,[KNN] Kennards | Analytics | Project,Benoit Weber,Privacy Artefact,Measure,Kennards,1,1,,,,,,Benoit,Weber,208594,
25389828,28/05/2026,28/05/2026 13:00,28/05/2026 14:30,[KNN] Kennards | Analytics | Project,Benoit Weber,Cleanse (deletion of unused assets),Measure,Kennards,1,1.5,480,8,0,,,Benoit,Weber,208594,44610556
25394415,29/05/2026,29/05/2026 12:45,29/05/2026 15:00,[KNN] Kennards | Analytics | Project,Benoit Weber,Cleanse - Naming Convention Application,Measure,Kennards,1,2.25,480,8,0,,,Benoit,Weber,208594,44610556
25399948,01/06/2026,01/06/2026 09:00,01/06/2026 13:00,[KNN] Kennards | Analytics | Project,Benoit Weber,"Kennards deck + implementation\n",Measure,Kennards,1,4,480,8,0,,,Benoit,Weber,208594,44610556
25414416,04/06/2026,04/06/2026 08:16,04/06/2026 09:16,[KNN] Kennards | Analytics | Project,Benoit Weber,Implement of consent in AU and NZ + deck finalisation,Measure,Kennards,1,1,480,8,0,,,Benoit,Weber,208594,44610556
25419954,05/06/2026,05/06/2026 06:25,05/06/2026 08:00,[KNN] Kennards | Analytics | Project,Benoit Weber,call with team + prep,Measure,Kennards,1,1.583,0,0,0,,,Benoit,Weber,208594,44610210
25309464,04/05/2026,04/05/2026 10:00,04/05/2026 12:00,[MFN] MA Financial | Paid Media | FEB-JAN 2027,Benoit Weber,Privacy Meeting,Growth,MA Financial,1,2,120,2,0,,,Benoit,Weber,208594,44368050
25389574,28/05/2026,28/05/2026 10:00,28/05/2026 11:00,[MFN] MA Financial | Paid Media | FEB-JAN 2027,Benoit Weber,CMP,Growth,MA Financial,1,1,120,2,0,,,Benoit,Weber,208594,44551859
25309632,05/05/2026,05/05/2026 06:02,05/05/2026 07:02,[PNN] Open Universities | SEO | OCT- SEPT 2026,Benoit Weber,Update of dashboard,Growth,Open Universities,1,1,300,5,0,,,Benoit,Weber,208594,44494351
25309840,05/05/2026,05/05/2026 07:30,05/05/2026 08:00,[PNN] Open Universities | Analytics |JAN-SEPT 2026,Benoit Weber,Rergroup with Yine,Measure,Open Universities,1,0.5,922,15,22,,,Benoit,Weber,208594,43989186
25314673,06/05/2026,06/05/2026 04:00,06/05/2026 04:30,[PNN] Open Universities | SEO | OCT- SEPT 2026,Benoit Weber,"dashboard\n",Growth,Open Universities,1,0.5,300,5,0,,,Benoit,Weber,208594,44494351
25323120,07/05/2026,07/05/2026 11:00,07/05/2026 12:30,[PNN] Open Universities | Analytics |JAN-SEPT 2026,Benoit Weber,CMP meeting + UTM meeting + Follow with Yine,Measure,Open Universities,1,1.5,922,15,22,,,Benoit,Weber,208594,43989186
25323127,08/05/2026,08/05/2026 03:00,08/05/2026 03:30,[PNN] Open Universities | Analytics |JAN-SEPT 2026,Benoit Weber,"Review, update to client and upload",Measure,Open Universities,1,0.5,922,15,22,,,Benoit,Weber,208594,43989186
25337997,12/05/2026,12/05/2026 07:00,12/05/2026 10:00,[PNN] Open Universities | Analytics |JAN-SEPT 2026,Benoit Weber,UTM Workshop + prep,Measure,Open Universities,1,3,,,,,,Benoit,Weber,208594,
25389520,28/05/2026,28/05/2026 09:00,28/05/2026 10:00,[PNN] Open Universities | Analytics |JAN-SEPT 2026,Benoit Weber,WIP + prep,Measure,Open Universities,1,1,922,15,22,,,Benoit,Weber,208594,43989186
25414397,04/06/2026,04/06/2026 08:00,04/06/2026 08:15,[PNN] Open Universities | Analytics |JAN-SEPT 2026,Benoit Weber,google signals check,Measure,Open Universities,1,0.25,922,15,22,,,Benoit,Weber,208594,43989187
25394188,29/05/2026,29/05/2026 12:00,29/05/2026 12:15,[PHX] PHYX | Paid Media | Keep the lights on,Benoit Weber,scope,Growth,PHYX,1,0.25,0,0,0,,,Benoit,Weber,208594,44576031
25363918,20/05/2026,20/05/2026 06:00,20/05/2026 08:00,[PTH] Pitchbook | SEO/GEO,Benoit Weber,Prep + Meeting with Francis,Optimise,PitchBook,1,2,600,10,0,,,Benoit,Weber,208594,44616611
25379449,26/05/2026,26/05/2026 09:00,26/05/2026 10:15,[PTH] Pitchbook | SEO/GEO,Benoit Weber,catchup and checks,Optimise,PitchBook,1,1.25,600,10,0,,,Benoit,Weber,208594,44616611
25394129,29/05/2026,29/05/2026 09:00,29/05/2026 10:00,[PTH] Pitchbook | SEO/GEO,Benoit Weber,Analytics regroup and check,Optimise,PitchBook,1,1,600,10,0,,,Benoit,Weber,208594,44616611
25404832,02/06/2026,02/06/2026 07:12,02/06/2026 08:12,[PTH] Pitchbook | SEO/GEO,Benoit Weber,Meeting with Fraancis + review,Optimise,PitchBook,1,1,600,10,0,,,Benoit,Weber,208594,44616611
25419957,05/06/2026,05/06/2026 08:45,05/06/2026 10:30,[PTH] Pitchbook | SEO/GEO,Benoit Weber,call with Francis + review + call with Ceci,Optimise,PitchBook,1,1.75,600,10,0,,,Benoit,Weber,208594,44616611
25394187,29/05/2026,29/05/2026 11:45,29/05/2026 12:00,[SMK] Smokeball AU | Paid Media | AUG-JUL 2026,Benoit Weber,UK Review,Growth,Smokeball,1,0.25,0,0,0,,,Benoit,Weber,208594,43170872
25309462,04/05/2026,04/05/2026 08:00,04/05/2026 10:00,[TPG] TPG | SEO | JAN-DEC 2026,Benoit Weber,Privacy Meeting,Growth,TPG Telecom,1,2,120,2,0,,,Benoit,Weber,208594,43847800
25343745,14/05/2026,14/05/2026 07:00,14/05/2026 09:00,[WRL] World2Cover | Digital Marketing,Benoit Weber,Privacy (sydney meeting),Growth,Tokio Marine,1,2,540,9,0,,,Benoit,Weber,208594,44288095
25359145,19/05/2026,19/05/2026 07:20,19/05/2026 07:45,[WRL] World2Cover | Digital Marketing,Benoit Weber,follow up,Growth,Tokio Marine,1,0.417,540,9,0,,,Benoit,Weber,208594,44288095
25368534,21/05/2026,21/05/2026 08:15,21/05/2026 08:30,[WRL] World2Cover | Digital Marketing,Benoit Weber,Report update,Growth,Tokio Marine,1,0.25,540,9,0,,,Benoit,Weber,208594,44519638
25323363,08/05/2026,08/05/2026 04:30,08/05/2026 09:15,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,Meeting + Prep,Measure,Village Roadshow Theme Parks,1,4.75,0,0,0,,,Benoit,Weber,208594,44020353
25363920,19/05/2026,19/05/2026 11:00,19/05/2026 12:00,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,follow up check,Measure,Village Roadshow Theme Parks,1,1,0,0,0,,,Benoit,Weber,208594,44300865
25368531,21/05/2026,21/05/2026 06:00,21/05/2026 08:00,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,Review + Meeting with Maine,Measure,Village Roadshow Theme Parks,1,2,0,0,0,,,Benoit,Weber,208594,44300865
25377064,22/05/2026,22/05/2026 06:00,22/05/2026 13:00,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,implementation,Measure,Village Roadshow Theme Parks,1,7,0,0,0,,,Benoit,Weber,208594,44020353
25379448,26/05/2026,26/05/2026 08:00,26/05/2026 09:00,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,village roadshow catcup,Measure,Village Roadshow Theme Parks,1,1,0,0,0,,,Benoit,Weber,208594,44020353
25389679,28/05/2026,28/05/2026 11:00,28/05/2026 12:00,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,CMP and emails with client,Measure,Village Roadshow Theme Parks,1,1,0,0,0,,,Benoit,Weber,208594,44020353
25394195,29/05/2026,29/05/2026 12:15,29/05/2026 12:45,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,village roadshow CMP,Measure,Village Roadshow Theme Parks,1,0.5,0,0,0,,,Benoit,Weber,208594,44300865
25400307,01/06/2026,01/06/2026 15:00,01/06/2026 15:45,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,CMP discussion with Onetrust,Measure,Village Roadshow Theme Parks,1,0.75,,,,,,Benoit,Weber,208594,
25405321,02/06/2026,02/06/2026 10:00,02/06/2026 10:30,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,scrum + follow up and checks,Measure,Village Roadshow Theme Parks,1,0.5,0,0,0,,,Benoit,Weber,208594,44300865
25409860,03/06/2026,03/06/2026 13:00,03/06/2026 15:30,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,GCP Implementation,Measure,Village Roadshow Theme Parks,1,2.5,0,0,0,,,Benoit,Weber,208594,44300865
25419941,04/06/2026,04/06/2026 09:15,04/06/2026 13:00,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,GCP Implementation,Measure,Village Roadshow Theme Parks,1,3.75,0,0,0,,,Benoit,Weber,208594,44300865
25419964,05/06/2026,05/06/2026 12:45,05/06/2026 14:00,[VLL] Village Roadshow | Analytics | End to End Transformation,Benoit Weber,review of DNS + checks + call with Andrew,Measure,Village Roadshow Theme Parks,1,1.25,0,0,0,,,Benoit,Weber,208594,44300865
`;

import { parse } from "querystring";

// Hand parse simple CSV safely
const lines = [];
let buffer = "";
let insideQuote = false;

for (let i = 0; i < csv.length; i++) {
  const char = csv[i];
  if (char === '"') {
    insideQuote = !insideQuote;
    buffer += char;
  } else if (char === '\n' && !insideQuote) {
    lines.push(buffer);
    buffer = "";
  } else {
    buffer += char;
  }
}
if (buffer) lines.push(buffer);

const header = lines[0];
const dataLines = lines.slice(1);

let total = 0;
let mayTotal = 0;
let juneTotal = 0;
let blankTaskIdTotal = 0;
let nonBlankTaskIdTotal = 0;

for (const line of dataLines) {
  if (!line.trim()) continue;
  
  // Safely parse CSV row splitting by comma, ignoring commas inside quotes
  const cols = [];
  let colBuffer = "";
  let inQ = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') {
      inQ = !inQ;
    } else if (c === ',' && !inQ) {
      cols.push(colBuffer.trim());
      colBuffer = "";
    } else {
      colBuffer += c;
    }
  }
  cols.push(colBuffer.trim());

  const id = cols[0];
  const dateStr = cols[1];
  const hours = parseFloat(cols[10]);
  const taskId = cols[19] || "";

  if (!isNaN(hours)) {
    total += hours;
    
    if (dateStr.includes("/05/2026")) {
      mayTotal += hours;
    } else if (dateStr.includes("/06/2026")) {
      juneTotal += hours;
    }

    if (!taskId) {
      blankTaskIdTotal += hours;
    } else {
      nonBlankTaskIdTotal += hours;
    }
  }
}

console.log("=== manual reconciliation audit result ===");
console.log("Total Decimal Hours in CSV:  ", total.toFixed(4));
console.log("May 2026 Hours:              ", mayTotal.toFixed(4));
console.log("June 2026 Hours:             ", juneTotal.toFixed(4));
console.log("Blank Task ID Hours (Unassigned): ", blankTaskIdTotal.toFixed(4));
console.log("Non-Blank Task ID Hours (Assigned):", nonBlankTaskIdTotal.toFixed(4));
