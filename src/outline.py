# Topic map mirroring the 26 major sections of Tintinalli's Emergency Medicine 9e
# (section names/order checked against the publisher's contents listing, ISBN 9781260019933).
# Topic names are short paraphrases at topic-name level only; no book text is reproduced.
# Coverage codes: v1 = already on the existing site (ported), new = built in this slice,
# merged = Renal/Pulmonary worker (emt-renal, branch add-renal-section), '' = not yet built.
# A topic marked (app) is an app addition that is not a separate 9e chapter.
S = []
def sec(id, n, title, icon, status, panels, topics, note=''):
    S.append(dict(id=id, n=n, title=title, icon=icon, status=status, panels=panels, topics=topics, note=note))

sec('prehosp',1,'Prehospital Care','🚑','soon',[],[
 ('EMS systems & medical oversight',''),('Prehospital equipment',''),('Air medical transport',''),('Mass gatherings',''),
 ('Interfacility transfer & referral (app – PH referral networks)','')])
sec('disaster',2,'Disaster Management','🌀','soon',[],[
 ('Disaster preparedness & mass-casualty triage',''),('Natural disasters (typhoon, flood, earthquake)',''),('Bomb, blast & crush injuries',''),
 ('Chemical disasters & decontamination',''),('Bioterrorism',''),('Radiation injuries','')])
sec('resus',3,'Resuscitation','🫀','v1',[('anaph','Anaphylaxis')],[
 ('Sudden cardiac death',''),('Approach to nontraumatic shock',''),('Approach to traumatic shock','v1'),('Allergy & anaphylaxis','v1'),
 ('Acid–base disorders',''),('Blood gases, pulse oximetry & capnography','v1'),('Fluids & electrolytes','merged'),
 ('Cardiac rhythm disturbances','v1+new'),('Antiarrhythmic & antihypertensive pharmacology','new'),('Vasopressors & inotropes','v1'),('Hyperbaric oxygen therapy','new')],
 'Shock-related cards live in Sepsis (S13), Trauma (S21) and Cardiovascular (S7).')
sec('resusproc',4,'Resuscitative Procedures','⏱','v1',[('resus','CPR · ACLS/PALS · code timer'),('airway','Airway & RSI')],[
 ('Basic CPR','v1'),('Defibrillation & electrical cardioversion','v1'),('Cardiac resuscitation (ACLS/PALS)','v1'),('Resuscitation in pregnancy','new'),
 ('Post-cardiac arrest care','v1'),('Ethics of resuscitation',''),('Noninvasive airway & supraglottic devices','v1'),('Tracheal intubation (RSI)','v1'),
 ('Mechanical ventilation','v1+merged'),('Surgical airway (CICO)','v1'),('Vascular access',''),('Hemodynamic monitoring',''),
 ('Cardiac pacing & implanted defibrillators','v1'),('Pericardiocentesis','new')])
sec('analgesia',5,'Analgesia, Anesthesia & Procedural Sedation','💉','soon',[],[
 ('Acute pain management',''),('Local & regional anesthesia (incl. LAST)','v1'),('Procedural sedation & analgesia',''),('Chronic pain in the ED','')])
sec('wound',6,'Wound Management','🩹','soon',[],[
 ('Wound evaluation',''),('Wound preparation',''),('Wound closure',''),('Face & scalp lacerations',''),('Arm, forearm & hand lacerations',''),
 ('Thigh, leg & foot lacerations',''),('Soft-tissue foreign bodies',''),('Puncture wounds & bites (incl. rabies PEP)',''),('Post-repair care & tetanus prophylaxis','')])
sec('cardio',7,'Cardiovascular Disease','❤️','built',[('cardio','Cardiovascular')],[
 ('Chest pain','new'),('Acute coronary syndromes / STEMI timelines','new'),('Cardiogenic shock','new'),('Low-probability ACS (HEART score)','new'),
 ('Syncope',''),('Acute heart failure','new'),('Valvular emergencies',''),('Cardiomyopathies & pericardial disease (pericarditis, myocarditis, tamponade)','new'),
 ('Venous thromboembolism incl. PE','merged'),('Systemic hypertension / hypertensive emergencies','new'),('Pulmonary hypertension',''),
 ('Aortic dissection & acute aortic syndromes (ADD-RS)','new'),('Aneurysmal disease (AAA)','new'),('Arterial occlusion',''),
 ('Brady/tachy/unstable arrhythmias (app – linked to ACLS & code timer)','v1+new')])
sec('pulm',8,'Pulmonary Disorders','🌬️','merged',[('pulm','Pulmonary')],[
 ('Respiratory distress & respiratory failure (NIV/HFNC)','merged'),('Hemoptysis','merged'),('Acute bronchitis & upper respiratory infections',''),
 ('Community-acquired & aspiration pneumonia','merged'),('Empyema & lung abscess / pleural effusion','merged'),('Tuberculosis',''),('Pneumothorax','merged'),
 ('Acute asthma','merged'),('COPD exacerbation','merged'),('ARDS & lung-protective ventilation (app)','merged')])
sec('gi',9,'Gastrointestinal Disorders','🫃','soon',[],[
 ('Acute abdominal pain',''),('Nausea & vomiting',''),('Diarrhea',''),('Constipation',''),('Upper GI bleeding',''),('Lower GI bleeding',''),
 ('Esophageal emergencies',''),('Peptic ulcer disease & gastritis',''),('Pancreatitis & cholecystitis',''),('Hepatic disorders',''),
 ('Appendicitis',''),('Diverticulitis',''),('Bowel obstruction',''),('Hernias',''),('Anorectal disorders',''),('GI procedures & devices',''),
 ('Complications of general surgery','')])
sec('renal',10,'Renal & Genitourinary Disorders','🫘','merged',[('renal','Renal & electrolytes')],[
 ('Acute kidney injury (KDIGO)','merged'),('Rhabdomyolysis',''),('End-stage renal disease / urgent dialysis','merged'),('UTI & hematuria',''),
 ('Acute urinary retention',''),('Male genital problems (torsion etc.)',''),('Urologic stone disease',''),('Urologic procedure & device complications',''),
 ('Hyperkalemia (app)','v1+merged'),('Hypo/hypernatremia, hypokalemia (app)','merged'),('Renal drug dosing (app)','merged')])
sec('obgyn',11,'Obstetrics & Gynecology','🤰','built',[('ob','Obstetric emergencies')],[
 ('Abnormal uterine bleeding',''),('Pelvic pain in the non-pregnant patient',''),('Ectopic pregnancy & first-20-week emergencies','new'),
 ('Comorbid disorders in pregnancy (VTE, trauma, drug safety)','new'),('Emergencies after 20 weeks & peripartum (pre-eclampsia, eclampsia, APH, PPH, AFE)','new'),
 ('Emergency delivery (shoulder dystocia, cord prolapse, breech, newborn)','new'),('Vulvovaginitis',''),('Pelvic inflammatory disease',''),
 ('Breast disorders',''),('Complications of gynecologic procedures',''),('Maternal cardiac arrest (app)','new')])
sec('peds',12,'Pediatrics','🧒','v1',[('peds','Pediatric tools')],[
 ('Emergency care of children (weight estimate, vitals)','v1'),('Neonatal & pediatric transport',''),('Neonatal resuscitation','new'),('Pediatric resuscitation (PALS)','v1'),
 ('Pediatric trauma',''),('Minor head injury & concussion',''),('Pediatric cervical spine injury',''),('Pediatric intubation & ventilation','v1'),
 ('Pediatric vascular access',''),('Pediatric analgesia & sedation',''),('Neonatal emergencies',''),('BRUE / ALTE',''),('Sudden unexpected infant death',''),
 ('Fever & serious bacterial illness',''),('Meningitis in children',''),('Ear & mastoid',''),('Pediatric eye emergencies',''),('Nose & sinus',''),
 ('Mouth & throat',''),('Neck masses',''),('Stridor & drooling',''),('Wheezing (bronchiolitis, asthma)','merged'),('Pediatric pneumonia',''),
 ('Congenital & acquired heart disease',''),('Syncope, dysrhythmias & pediatric ECG',''),('Vomiting, diarrhea & dehydration',''),
 ('Fluid & electrolyte therapy (maintenance)','v1'),('Pediatric abdominal pain',''),('Pediatric GI bleeding',''),('Pediatric UTI',''),
 ('Pediatric urologic & gynecologic disorders',''),('Pediatric renal emergencies',''),('Seizures in children','v1'),('Headache in children',''),
 ('Altered mental status in children',''),('Pediatric orthopedic emergencies',''),('Rashes in children',''),('Sickle cell disease in children',''),
 ('Pediatric hematologic emergencies',''),('Pediatric oncologic emergencies',''),('Metabolic emergencies (inborn errors)',''),('Diabetes in children (DKA)','v1'),
 ('Children with special healthcare needs',''),('Behavioral disorders in children',''),('Child abuse & neglect','')])
sec('id',13,'Infectious Diseases','🦠','v1',[('sepsis','Sepsis')],[
 ('Sepsis & septic shock','v1'),('Soft-tissue infections',''),('Sexually transmitted infections',''),('Serious viral infections (dengue, measles, influenza)',''),
 ('HIV infection',''),('Endocarditis',''),('Tetanus',''),('Rabies',''),('Malaria',''),('Food- & waterborne illness',''),('Zoonoses (e.g. leptospirosis)',''),
 ('Global travelers',''),('Occupational exposures & PEP','')])
sec('neuro',14,'Neurology','🧠','v1',[('neuro','Neurology')],[
 ('Neurologic examination (GCS, NIHSS)','v1'),('Headache',''),('Subarachnoid & intracerebral hemorrhage',''),('Stroke syndromes & thrombolysis windows','v1'),
 ('Altered mental status & coma',''),('Ataxia & gait disturbance',''),('Vertigo',''),('Seizures & status epilepticus','v1'),
 ('Acute peripheral neurologic disorders (GBS, myasthenia)',''),('Chronic neurologic disorders',''),('CNS & spinal infections',''),('CNS procedures & devices','')])
sec('tox',15,'Toxicology','☠️','built',[('tox','Toxicology')],[
 ('General management of the poisoned patient','new'),('Cyclic antidepressants','v1+new'),('Atypical & serotonergic antidepressants / serotonin syndrome','new'),
 ('MAO inhibitors',''),('Antipsychotics / NMS','new'),('Lithium','new'),('Barbiturates',''),('Benzodiazepines','v1'),('Non-benzodiazepine sedatives',''),
 ('Alcohols (toxic alcohols, methanol)','v1+new'),('Opioids','v1+new'),('Cocaine & amphetamines','new'),('Hallucinogens',''),('Salicylates','new'),
 ('Acetaminophen (paracetamol)','v1+new'),('NSAIDs',''),('Methylxanthines & nicotine',''),('Digoxin & cardiac glycosides','v1+new'),('β-blockers','v1+new'),
 ('Calcium channel blockers','v1+new'),('Other antihypertensives (clonidine)',''),('Anticonvulsants',''),('Iron','v1+new'),('Hydrocarbons & volatile substances','new'),
 ('Caustics & button batteries','new'),('Pesticides (organophosphates, carbamates, paraquat)','v1+new'),('Anticholinergics','v1+new'),('Metals & metalloids',''),
 ('Industrial toxins (cyanide)','v1'),('Vitamins & herbals',''),('Antimicrobials (isoniazid)','v1'),('Dyshemoglobinemias (methemoglobinemia)','v1+new'),
 ('Local anesthetic systemic toxicity (app)','v1')])
sec('env',16,'Environmental Injuries','🏝️','built',[('env','Environmental')],[
 ('Cold injuries / frostbite','new'),('Hypothermia','new'),('Heat emergencies (heat stroke, cold-water immersion)','new'),
 ('Bites & stings (spiders, scorpions, centipedes, Hymenoptera)','new'),('Snakebite (PH cobras, pit vipers, 20WBCT)','new'),
 ('Marine trauma & envenomation (box jellyfish)','new'),('Diving disorders','new'),('Drowning','new'),('High-altitude illness','new'),
 ('Thermal burns','v1'),('Chemical burns',''),('Electrical & lightning injuries','new'),('Mushroom poisoning',''),('Poisonous plants',''),('Carbon monoxide','new')])
sec('endo',17,'Endocrine Disorders','🍬','built',[('endo','Endocrine')],[
 ('Type 1 diabetes',''),('Type 2 diabetes (drug-related hypoglycemia)','new'),('Diabetic ketoacidosis','v1+new'),('Ketoacidotic syndromes (alcoholic, euglycemic)','new'),
 ('Hyperosmolar hyperglycemic state','new'),('Hypothyroidism & myxedema coma','new'),('Hyperthyroidism & thyroid storm','new'),('Adrenal insufficiency & adrenal crisis','new'),
 ('Hypoglycemia (app)','v1+new')])
sec('heme',18,'Hematologic & Oncologic Disorders','🩸','soon',[],[
 ('Anemia & polycythemia',''),('Hemostasis',''),('Acquired bleeding disorders / anticoagulant reversal','v1'),('Clotting disorders',''),
 ('Hemophilias & von Willebrand disease',''),('Sickle cell & hereditary hemolytic anemias',''),('Acquired hemolytic anemia (TTP/HUS)',''),
 ('Transfusion therapy (MTP)','v1'),('Thrombotics & antithrombotics',''),('Emergency complications of malignancy','')])
sec('eent',19,'Eye, Ear, Nose, Throat & Oral Disorders','👁️','soon',[],[
 ('Eye emergencies',''),('Ear disorders',''),('Face & jaw emergencies',''),('Nose & sinuses (epistaxis)',''),('Oral & dental emergencies',''),
 ('Neck & upper airway (angioedema, deep neck infection)',''),('Complications of airway devices','')])
sec('derm',20,'Dermatology','🧴','soon',[],[
 ('Initial evaluation of skin disorders',''),('Generalized skin disorders (SJS/TEN, DRESS)',''),('Face & scalp',''),('Trunk',''),('Groin & skinfolds',''),('Extremities','')])
sec('trauma',21,'Trauma','🩻','v1',[('trauma','Trauma')],[
 ('Trauma in adults (primary survey)','v1'),('Trauma in older adults',''),('Trauma in pregnancy','new'),('Head trauma / raised ICP','v1'),('Spine trauma',''),
 ('Facial trauma',''),('Neck trauma',''),('Pulmonary trauma (tension pneumothorax)','merged'),('Cardiac trauma',''),('Abdominal trauma (eFAST)','v1'),
 ('Flank & buttock trauma',''),('Genitourinary trauma',''),('Extremity trauma (hemorrhage control)','v1'),('Massive transfusion & TXA (app)','v1'),('Burn resuscitation (app)','v1')])
sec('ortho',22,'Orthopedics','🦴','soon',[],[
 ('Initial evaluation of orthopedic injuries',''),('Hand & digit injuries',''),('Wrist injuries',''),('Elbow & forearm injuries',''),('Shoulder & humerus injuries',''),
 ('Pelvic injuries',''),('Hip & femur injuries',''),('Knee injuries',''),('Leg injuries',''),('Ankle injuries',''),('Foot injuries',''),('Compartment syndrome','')])
sec('msk',23,'Musculoskeletal Disorders','🦵','soon',[],[
 ('Neck & back pain (red flags)',''),('Shoulder pain',''),('Hip & knee pain',''),('Systemic rheumatic diseases',''),('Non-traumatic hand disorders',''),
 ('Joints & bursae (septic arthritis, gout)',''),('Soft-tissue problems of the foot','')])
sec('psych',24,'Psychosocial Disorders','💬','soon',[],[
 ('Mental health evaluation & disposition',''),('Acute agitation',''),('Mental health disorders of older adults',''),('Mood & anxiety disorders / suicide risk',''),
 ('Psychoses',''),('Eating disorders',''),('Substance use disorders (alcohol withdrawal)','')])
sec('abuse',25,'Abuse & Assault','🛡️','soon',[],[
 ('Sexual assault',''),('Intimate partner violence',''),('Abuse of older & impaired adults','')])
sec('special',26,'Special Situations','⭐','soon',[],[
 ('People who inject drugs',''),('The transplant patient',''),('Morbid obesity (dosing weights)',''),('The transgender patient',''),('Palliative care',''),
 ('Death notification & advance directives',''),('Military medicine',''),('Legal issues in emergency medicine','')])

# ---- batch build-out (Oct 2026): mark sections built; covered topics → 'new' (existing codes kept as v1+new etc.)
def built(id, panels, covered=None, note=None):
    x=[y for y in S if y['id']==id][0]; x['status']='built'
    for p in panels:
        if p not in x['panels']: x['panels'].append(p)
    t2=[]
    for name,c in x['topics']:
        hit = covered is None or any(name.lower().startswith(k.lower()) for k in covered)
        if hit: c = 'new' if c=='' else (c if 'new' in c else c+'+new' if c in ('v1','merged') else c)
        t2.append((name,c))
    x['topics']=t2
    if note: x['note']=note
built('prehosp',[('prehosp','Prehospital & transfer')])
built('disaster',[('disaster','Disaster & MCI')])
built('analgesia',[('analg','Analgesia & sedation')])
built('wound',[('wound','Wound management')])
built('gi',[('gi','GI disorders')])
built('heme',[('heme','Heme / Onc')],covered=['Anemia','Hemostasis','Acquired bleeding','Clotting','Hemophilias','Sickle','Acquired hemolytic','Transfusion','Emergency complications'])
built('eent',[('eent','EENT & oral')])
built('derm',[('derm','Dermatology')])
built('ortho',[('ortho','Orthopedics')])
built('msk',[('msk','Musculoskeletal')])
built('psych',[('psych','Psychosocial')])
built('abuse',[('abuse','Abuse & assault')])
built('special',[('special','Special situations')])
built('peds',[('pedsem','Pediatric emergencies')],covered=['Neonatal emergencies','BRUE','Sudden','Fever','Pediatric cervical','Minor head','Stridor','Wheezing','Pediatric pneumonia','Congenital','Vomiting','Pediatric abdominal','Pediatric UTI','Pediatric urologic','Pediatric orthopedic','Metabolic','Child abuse','Meningitis in children'])
built('id',[('infect','Infectious diseases')],covered=['Sexually','Serious viral','HIV','Endocarditis','Tetanus','Rabies','Malaria','Food','Zoonoses','Global','Occupational','Soft-tissue'])
built('resus',[('shock','Shock, acid–base & HBO')],covered=['Sudden','Approach to nontraumatic','Acid','Blood gases','Hyperbaric'])
built('resusproc',[('proc','Access, monitoring & post-arrest')],covered=['Post-cardiac','Ethics','Vascular','Hemodynamic','Cardiac pacing','Pericardiocentesis'])
built('neuro',[],covered=['Headache','Subarachnoid','Altered','Ataxia','Vertigo','Acute peripheral','CNS & spinal'])
built('trauma',[],covered=['Trauma in older','Spine','Facial','Neck','Pulmonary','Cardiac','Abdominal','Flank','Genitourinary','Head trauma'])
