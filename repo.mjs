import { Actual360, BusinessDayConvention, Compounding, DateGeneration, DiscountingBondEngine, FixedRateBond, FixedRateBondForward, FlatForward, Frequency, NullCalendar, Period, Position, RelinkableHandle, Schedule, Settings, Thirty360 } from '/ql.mjs';

example('repo example', () => { 

    const repoSettlementDate = new Date('14-February-2000');
    const repoDeliveryDate = new Date('15-August-2000');
    const repoRate = 0.05;
    const repoDayCountConvention = new Actual360();
    const repoSettlementDays = 0;
    const repoCompounding = Compounding.Simple;
    const repoCompoundFreq = Frequency.Annual;
    const bondIssueDate = new Date('15-September-1995');
    const bondDatedDate = new Date('15-September-1995');
    const bondMaturityDate = new Date('15-September-2005');
    const bondCoupon = 0.08;
    const bondCouponFrequency = Frequency.Semiannual;
    const bondCalendar = new NullCalendar();
    const bondDayCountConvention = new Thirty360(Thirty360.Convention.BondBasis);
    const bondSettlementDays = 0;
    const bondBusinessDayConvention = BusinessDayConvention.Unadjusted;
    const bondCleanPrice = 89.97693786;
    const bondRedemption = 100.0;
    const faceAmount = 100.0;
    Settings.evaluationDate.set(repoSettlementDate);
    const bondCurve = new RelinkableHandle();
    bondCurve.linkTo(new FlatForward().ffInit2(repoSettlementDate, .01, bondDayCountConvention, Compounding.Compounded, bondCouponFrequency));
    const bondSchedule = new Schedule().init2(bondDatedDate, bondMaturityDate, new Period().init2(bondCouponFrequency), bondCalendar, bondBusinessDayConvention, bondBusinessDayConvention, DateGeneration.Rule.Backward, false);
    const bond = new FixedRateBond().frbInit1(bondSettlementDays, faceAmount, bondSchedule, [bondCoupon], bondDayCountConvention, bondBusinessDayConvention, bondRedemption, bondIssueDate);
    bond.setPricingEngine(new DiscountingBondEngine(bondCurve));
    bondCurve.linkTo(new FlatForward().ffInit2(repoSettlementDate, bond.yield2(bondCleanPrice, bondDayCountConvention, Compounding.Compounded, bondCouponFrequency), bondDayCountConvention, Compounding.Compounded, bondCouponFrequency));
    const fwdType = Position.Type.Long;
    const dummyStrike = 91.5745;
    const repoCurve = new RelinkableHandle();
    repoCurve.linkTo(new FlatForward().ffInit2(repoSettlementDate, repoRate, repoDayCountConvention, repoCompounding, repoCompoundFreq));
    const bondFwd = new FixedRateBondForward(repoSettlementDate, repoDeliveryDate, fwdType, dummyStrike, repoSettlementDays, repoDayCountConvention, bondCalendar, bondBusinessDayConvention, bond, repoCurve, repoCurve);
    print(`Underlying bond clean price: ${bond.cleanPrice1()}\n` +
        `Underlying bond dirty price: ${bond.dirtyPrice1()}\n` +
        'Underlying bond accrued at settlement: ' +
        `${bond.accruedAmount(repoSettlementDate)}\n` +
        'Underlying bond accrued at delivery: ' +
        `${bond.accruedAmount(repoDeliveryDate)}\n` +
        `Underlying bond spot income: ${bondFwd.spotIncome(repoCurve)}\n` +
        `Underlying bond fwd income: ${bondFwd.spotIncome(repoCurve) /
            repoCurve.currentLink().discount1(repoDeliveryDate)}\n` +
        `Repo strike: ${dummyStrike}\n` +
        `Repo NPV: ${bondFwd.NPV()}\n` +
        `Repo clean forward price: ${bondFwd.cleanForwardPrice()}\n` +
        `Repo dirty forward price: ${bondFwd.forwardPrice()}\n` +
        `Repo implied yield: ${bondFwd.impliedYield(bond.dirtyPrice1(), dummyStrike, repoSettlementDate, repoCompounding, repoDayCountConvention)}\n` +
        `Market repo rate: ${repoCurve.currentLink().zeroRate1(repoDeliveryDate, repoDayCountConvention, repoCompounding, repoCompoundFreq)}\n` +
        `Compare with example given at
    http://www.fincad.com/support/developerFunc/mathref/BFWD.htm

    Clean forward price = 88.2408

    In that example, it is unknown what bond calendar they are
    using, as well as settlement Days. For that reason, I have
    made the simplest possible assumptions here: NullCalendar
    and 0 settlement days.`);

});