// v10.8.54 test-only archive.
 // These models were removed from the production WebView because they are comparison/validation tools,
 // not part of the live Shizukuru mixer. Kept here for offline regression/reference work only.
const KMPigmentReferenceModel=Object.freeze({
  id:'km-reference-linear-rgb-ks-v1',
  epsilon:1e-5,
  srgbToLinear(channel){
    const c=clamp(Number(channel)||0,0,255)/255;
    return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
  },
  linearToSrgb(value){
    const c=clamp(Number(value)||0,0,1);
    const encoded=c<=.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-.055;
    return clamp(encoded*255,0,255);
  },
  reflectanceToKS(reflectance){
    const r=clamp(Number(reflectance)||0,this.epsilon,1);
    return ((1-r)*(1-r))/(2*r);
  },
  ksToReflectance(ks){
    const x=Math.max(0,Number(ks)||0);
    return clamp(1+x-Math.sqrt(x*x+2*x),0,1);
  },
  sourceKS(hex){
    return rgb(hex).map(channel=>this.reflectanceToKS(this.srgbToLinear(channel)));
  },
  mixPair(a,b,t=.5){
    const ratio=clamp(Number(t)||0,0,1);
    if(ratio<=0)return rgb(a);
    if(ratio>=1)return rgb(b);
    const A=this.sourceKS(a),B=this.sourceKS(b);
    return A.map((ks,index)=>this.linearToSrgb(this.ksToReflectance(lerp(ks,B[index],ratio))));
  },
  mixAggregate(sources){
    const active=[];
    for(const [hex,amountRaw] of sources||[]){
      const amount=Math.max(0,Number(amountRaw)||0);
      if(amount>0)active.push([hex,amount]);
    }
    const total=active.reduce((sum,[,amount])=>sum+amount,0);
    if(!(total>0))return null;
    if(active.length===1)return rgb(active[0][0]);
    const mixed=[0,0,0];
    for(const [hex,amount] of active){
      const ks=this.sourceKS(hex),weight=amount/total;
      for(let i=0;i<3;i++)mixed[i]+=ks[i]*weight;
    }
    return mixed.map(ks=>this.linearToSrgb(this.ksToReflectance(ks)));
  },
  comparePair(a,b,t=.5){
    const ryb=RYBPaintMixingEngine.mixPair(a,b,t);
    const km=this.mixPair(a,b,t);
    return Object.freeze({a,b,t,ryb:Object.freeze(ryb.map(Math.round)),km:Object.freeze(km.map(Math.round))});
  },
  ratioSweep(a,b,steps=[0,.1,.25,.5,.75,.9,1]){
    return Object.freeze(steps.map(t=>this.comparePair(a,b,t)));
  }
});

const MixingReferenceBench=Object.freeze({
  id:'ryb-vs-km-reference-bench-v1',
  kmModel:KMPigmentReferenceModel.id,
  // Representative sweeps for tuning.  No result from this bench is fed back
  // into the live mixer; changes remain explicit and testable.
  run(){
    return Object.freeze({
      blueYellow:KMPigmentReferenceModel.ratioSweep('#1a80ff','#ffd622'),
      redYellow:KMPigmentReferenceModel.ratioSweep('#ff2f1f','#ffd622'),
      redBlue:KMPigmentReferenceModel.ratioSweep('#ff2f1f','#1a80ff')
    });
  }
});



const RYBEngineValidationSuite=Object.freeze({
  run(){
    const primaryCases=[
      Object.freeze({id:'blue-yellow',a:'#1a80ff',b:'#ffd622',expected:'green'}),
      Object.freeze({id:'red-yellow',a:'#ff2f1f',b:'#ffd622',expected:'orange'}),
      Object.freeze({id:'red-blue',a:'#ff2f1f',b:'#1a80ff',expected:'purple'})
    ];
    const classify=([r,g,b])=>{
      if(g>r*.78&&g>b*.82)return 'green';
      if(r>g&&g>b*1.35)return 'orange';
      if(r>b*.72&&b>g*1.25)return 'purple';
      return 'other';
    };
    const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    const rounded=color=>Object.freeze(color.map(v=>Math.round(v)));
    const primaryResults=primaryCases.map(test=>{
      const color=RYBPaintMixingEngine.mixPair(test.a,test.b,.5);
      const actual=classify(color);
      return Object.freeze({...test,actual,pass:actual===test.expected,rgb:rounded(color)});
    });

    const identityColors=['#ff2f1f','#ffd622','#1a80ff','#ffffff','#111111'];
    const identityResults=identityColors.map(hex=>{
      const source=rgb(hex);
      const left=RYBPaintMixingEngine.mixPair(hex,'#ffffff',0);
      const right=RYBPaintMixingEngine.mixPair('#ffffff',hex,1);
      const same=RYBPaintMixingEngine.mixPair(hex,hex,.5);
      const pass=distance(source,left)<.001&&distance(source,right)<.001&&distance(source,same)<.001;
      return Object.freeze({hex,pass});
    });

    const weightedCases=[
      Object.freeze({id:'blue-yellow-25',a:'#1a80ff',b:'#ffd622',t:.25}),
      Object.freeze({id:'blue-yellow-75',a:'#1a80ff',b:'#ffd622',t:.75}),
      Object.freeze({id:'red-blue-25',a:'#ff2f1f',b:'#1a80ff',t:.25}),
      Object.freeze({id:'red-blue-75',a:'#ff2f1f',b:'#1a80ff',t:.75})
    ];
    const weightedResults=weightedCases.map(test=>{
      const mixed=RYBPaintMixingEngine.mixPair(test.a,test.b,test.t);
      const da=distance(mixed,rgb(test.a));
      const db=distance(mixed,rgb(test.b));
      const shouldFavorB=test.t>.5;
      const pass=shouldFavorB?db<da:da<db;
      return Object.freeze({...test,pass,rgb:rounded(mixed)});
    });

    const profileCases=[.1,.25,.5,.75,.9];
    const profileResults=profileCases.map(t=>{
      const shaped=RYBPaintMixProfile.shapeRatio(t);
      const mirror=RYBPaintMixProfile.shapeRatio(1-t);
      const endpointSafe=shaped>=0&&shaped<=1;
      const midpointSafe=t!==.5||Math.abs(shaped-.5)<1e-12;
      const symmetrySafe=Math.abs((shaped+mirror)-1)<1e-12;
      const dominanceSafe=t===.5||(t<.5?shaped<t:shaped>t);
      return Object.freeze({t,shaped,pass:endpointSafe&&midpointSafe&&symmetrySafe&&dominanceSafe});
    });

    const aggregateCases=[
      Object.freeze({id:'equal-red-blue',a:'#ff2f1f',b:'#1a80ff',wa:1,wb:1}),
      Object.freeze({id:'yellow-heavy',a:'#1a80ff',b:'#ffd622',wa:1,wb:3})
    ];
    const aggregateResults=aggregateCases.map(test=>{
      const total=test.wa+test.wb;
      const aggregate=RYBPaintMixingEngine.mixAggregate({
        total,
        sources:new Map([[test.a,test.wa],[test.b,test.wb]])
      });
      const pair=RYBPaintMixingEngine.mixPair(test.a,test.b,test.wb/total);
      const pass=!!aggregate&&distance(aggregate,pair)<.001;
      return Object.freeze({...test,pass,rgb:rounded(aggregate||[0,0,0])});
    });

    const grayRegressionCases=[
      Object.freeze({id:'blue-yellow-must-not-be-gray',a:'#1a80ff',b:'#ffd622',t:.5})
    ];
    const grayRegressionResults=grayRegressionCases.map(test=>{
      const mixed=RYBPaintMixingEngine.mixPair(test.a,test.b,test.t);
      const [r,g,b]=mixed;
      const spread=Math.max(r,g,b)-Math.min(r,g,b);
      const greenDominant=g>r*.78&&g>b*.82;
      const notNeutral=spread>=28;
      return Object.freeze({...test,pass:greenDominant&&notNeutral,rgb:rounded(mixed),channelSpread:spread});
    });

    const appearanceCases=[
      Object.freeze({id:'red-yellow-luminance',a:'#ff2f1f',b:'#ffd622',t:.5}),
      Object.freeze({id:'blue-yellow-luminance',a:'#1a80ff',b:'#ffd622',t:.5}),
      Object.freeze({id:'red-blue-luminance',a:'#ff2f1f',b:'#1a80ff',t:.5})
    ];
    const appearanceResults=appearanceCases.map(test=>{
      const shaped=RYBPaintMixProfile.shapeRatio(test.t);
      const mixed=RYBPaintMixingEngine.mixPair(test.a,test.b,test.t);
      const sourceLum=RYBPaintAppearanceProfile.luminance(rgb(test.a))*(1-shaped)+
        RYBPaintAppearanceProfile.luminance(rgb(test.b))*shaped;
      const mixedLum=RYBPaintAppearanceProfile.luminance(mixed);
      const minimum=sourceLum*RYBPaintAppearanceProfile.luminanceFloorRatio*.999;
      const maximum=sourceLum*RYBPaintAppearanceProfile.maxLift+1;
      return Object.freeze({...test,pass:mixedLum>=minimum&&mixedLum<=maximum,luminance:mixedLum});
    });

    const pastelCases=[
      Object.freeze({id:'red-white-pastel',color:'#ff2f1f',expected:'red'}),
      Object.freeze({id:'yellow-white-pastel',color:'#ffd622',expected:'yellow'}),
      Object.freeze({id:'blue-white-pastel',color:'#1a80ff',expected:'blue'})
    ];
    const pastelClassify=([r,g,b])=>{
      if(r>g*1.18&&r>b*1.18)return 'red';
      if(r>b*1.35&&g>b*1.35)return 'yellow';
      if(b>r*1.12&&b>g*1.08)return 'blue';
      return 'other';
    };
    const pastelResults=pastelCases.map(test=>{
      const base=RYBPaintMixingEngine.mixAggregate({
        total:2,
        sources:new Map([[test.color,1],['#ffffff',1]]),
        waterLevel:0,
        mixLevel:0
      });
      const source=rgb(test.color);
      const luminanceRaised=RYBPaintAppearanceProfile.luminance(base)>RYBPaintAppearanceProfile.luminance(source);
      const huePreserved=pastelClassify(base)===test.expected;
      const notWhite=distance(base,[255,255,255])>28;
      const strength=RYBWhitePaintPastelProfile.strength([[test.color,.5],['#ffffff',.5]]);
      const pass=luminanceRaised&&huePreserved&&notWhite&&strength<=.181;
      return Object.freeze({...test,pass,rgb:rounded(base),strength});
    });


    const blackDepthCases=[
      Object.freeze({id:'red-black-depth',color:'#ff2f1f',expected:'red'}),
      Object.freeze({id:'yellow-black-depth',color:'#ffd622',expected:'yellow'}),
      Object.freeze({id:'blue-black-depth',color:'#1a80ff',expected:'blue'})
    ];
    const blackHueClassify=([r,g,b])=>{
      // Yellow must be classified before red: warm dark yellows can have r > g * 1.16.
      if(r>b*1.28&&g>b*1.28&&g>=r*.62)return 'yellow';
      if(r>g*1.16&&r>b*1.16)return 'red';
      if(b>r*1.08&&b>g*1.05)return 'blue';
      return 'other';
    };
    const blackDepthResults=blackDepthCases.map(test=>{
      const source=rgb(test.color);
      const lightBlack=RYBPaintMixingEngine.mixAggregate({
        total:10,
        sources:new Map([[test.color,9],['#000000',1]]),
        waterLevel:0,
        mixLevel:0
      });
      const mediumBlack=RYBPaintMixingEngine.mixAggregate({
        total:2,
        sources:new Map([[test.color,1],['#000000',1]]),
        waterLevel:0,
        mixLevel:0
      });
      const sourceLum=RYBPaintAppearanceProfile.luminance(source);
      const lightLum=RYBPaintAppearanceProfile.luminance(lightBlack);
      const mediumLum=RYBPaintAppearanceProfile.luminance(mediumBlack);
      const huePreserved=blackHueClassify(lightBlack)===test.expected&&blackHueClassify(mediumBlack)===test.expected;
      const progressive=sourceLum>lightLum&&lightLum>mediumLum;
      const notCollapsed=lightLum>=sourceLum*.78&&mediumLum>=sourceLum*.45;
      const pass=huePreserved&&progressive&&notCollapsed;
      return Object.freeze({...test,pass,lightRgb:rounded(lightBlack),mediumRgb:rounded(mediumBlack),sourceLum,lightLum,mediumLum});
    });


    const earthinessCases=[
      Object.freeze({id:'red-green-earthiness',sources:[['#ff2f1f',1],['#36a85f',1]],expectedStrength:true}),
      Object.freeze({id:'yellow-purple-earthiness',sources:[['#ffd622',1],['#8b55c5',1]],expectedStrength:true}),
      Object.freeze({id:'blue-orange-earthiness',sources:[['#1a80ff',1],['#f08a24',1]],expectedStrength:true}),
      Object.freeze({id:'red-yellow-blue-earthiness',sources:[['#ff2f1f',1],['#ffd622',1],['#1a80ff',1]],expectedStrength:true}),
      Object.freeze({id:'blue-yellow-stays-clean',sources:[['#1a80ff',1],['#ffd622',1]],expectedStrength:false})
    ];
    const earthinessResults=earthinessCases.map(test=>{
      const balanced=RYBPaintMixProfile.normalizeWeights(test.sources);
      const strength=RYBComplementaryEarthProfile.strength(balanced);
      const mixed=RYBPaintMixingEngine.mixAggregate({
        total:test.sources.reduce((sum,[,amount])=>sum+amount,0),
        sources:new Map(test.sources),
        waterLevel:0,
        mixLevel:0
      });
      const spread=Math.max(...mixed)-Math.min(...mixed);
      const triggered=strength>0;
      const strengthExpected=triggered===test.expectedStrength;
      const bounded=strength<=RYBComplementaryEarthProfile.maxNeutralBlend+.001;
      const notGray=spread>=18;
      const pass=strengthExpected&&bounded&&notGray;
      return Object.freeze({...test,pass,rgb:rounded(mixed),strength,channelSpread:spread});
    });

    const waterCases=[
      Object.freeze({id:'blue-yellow-water',a:'#1a80ff',b:'#ffd622',waterLevel:1}),
      Object.freeze({id:'red-yellow-water',a:'#ff2f1f',b:'#ffd622',waterLevel:1}),
      Object.freeze({id:'red-blue-water',a:'#ff2f1f',b:'#1a80ff',waterLevel:1})
    ];
    const waterResults=waterCases.map(test=>{
      const dry=RYBPaintMixingEngine.mixAggregate({
        total:2,
        sources:new Map([[test.a,1],[test.b,1]]),
        waterLevel:0
      });
      const wet=RYBPaintMixingEngine.mixAggregate({
        total:2,
        sources:new Map([[test.a,1],[test.b,1]]),
        waterLevel:test.waterLevel
      });
      const dryLum=RYBPaintAppearanceProfile.luminance(dry);
      const wetLum=RYBPaintAppearanceProfile.luminance(wet);
      const dryClass=classify(dry),wetClass=classify(wet);
      const spread=Math.max(...wet)-Math.min(...wet);
      const dulling=RYBOverwaterDullingProfile.strength(test.waterLevel);
      const pass=wetLum>dryLum&&wetClass===dryClass&&spread>=24&&distance(dry,wet)<=58&&dulling<=.041;
      return Object.freeze({...test,pass,dryRgb:rounded(dry),wetRgb:rounded(wet),dryClass,wetClass,dulling});
    });

    const overmixCases=[
      Object.freeze({id:'blue-yellow-overmix',a:'#1a80ff',b:'#ffd622'}),
      Object.freeze({id:'red-yellow-overmix',a:'#ff2f1f',b:'#ffd622'}),
      Object.freeze({id:'red-blue-overmix',a:'#ff2f1f',b:'#1a80ff'})
    ];
    const overmixResults=overmixCases.map(test=>{
      const normal=RYBPaintMixingEngine.mixAggregate({
        total:2,
        sources:new Map([[test.a,1],[test.b,1]]),
        waterLevel:0,
        mixLevel:RYBOvermixDullingProfile.onset
      });
      const overmixed=RYBPaintMixingEngine.mixAggregate({
        total:2,
        sources:new Map([[test.a,1],[test.b,1]]),
        waterLevel:0,
        mixLevel:1
      });
      const normalClass=classify(normal),overmixClass=classify(overmixed);
      const spread=Math.max(...overmixed)-Math.min(...overmixed);
      const dulling=RYBOvermixDullingProfile.strength(1);
      const pass=normalClass===overmixClass&&spread>=24&&distance(normal,overmixed)<=18&&dulling<=.036;
      return Object.freeze({...test,pass,normalRgb:rounded(normal),overmixRgb:rounded(overmixed),normalClass,overmixClass,dulling});
    });

    const groups=Object.freeze({
      primaries:Object.freeze(primaryResults),
      identity:Object.freeze(identityResults),
      weighting:Object.freeze(weightedResults),
      profile:Object.freeze(profileResults),
      grayRegression:Object.freeze(grayRegressionResults),
      appearance:Object.freeze(appearanceResults),
      pastel:Object.freeze(pastelResults),
      blackDepth:Object.freeze(blackDepthResults),
      earthiness:Object.freeze(earthinessResults),
      water:Object.freeze(waterResults),
      overmix:Object.freeze(overmixResults),
      aggregateParity:Object.freeze(aggregateResults)
    });
    const all=[...primaryResults,...identityResults,...weightedResults,...profileResults,...grayRegressionResults,...appearanceResults,...pastelResults,...blackDepthResults,...earthinessResults,...waterResults,...overmixResults,...aggregateResults];
    return Object.freeze({passed:all.every(result=>result.pass),groups});
  }
});

// Compatibility name retained for existing debugging commands.
const RYBEngineSelfTest=Object.freeze({
  run(){return RYBEngineValidationSuite.run()}
});

