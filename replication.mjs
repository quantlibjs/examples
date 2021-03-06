/**
 * Copyright 2019 - 2020 Jin Yang. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { Actual365Fixed, AnalyticBarrierEngine, AnalyticEuropeanEngine, Barrier, BarrierOption, BlackConstantVol, BlackScholesProcess, CashOrNothingPayoff, CompositeInstrument, DateExt, EuropeanExercise, EuropeanOption, FlatForward, Handle, NullCalendar, Option, PlainVanillaPayoff, Settings, SimpleQuote, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`replication example ${version}`, () => { 

    const today = DateExt.UTC('29,May,2006');
    Settings.evaluationDate.set(today);
    const barrierType = Barrier.Type.DownOut;
    const barrier = 70.0;
    const rebate = 0.0;
    const type = Option.Type.Put;
    const underlyingValue = 100.0;
    const underlying = new SimpleQuote(underlyingValue);
    const strike = 100.0;
    const riskFreeRate = new SimpleQuote(0.04);
    const volatility = new SimpleQuote(0.20);
    const maturity = DateExt.advance(today, 1, TimeUnit.Years);
    const dayCounter = new Actual365Fixed();
    const h1 = new Handle(riskFreeRate);
    const h2 = new Handle(volatility);
    const flatRate = new Handle(new FlatForward().ffInit3(0, new NullCalendar(), h1, dayCounter));
    const flatVol = new Handle(new BlackConstantVol().bcvInit4(0, new NullCalendar(), h2, dayCounter));
    const exercise = new EuropeanExercise(maturity);
    const payoff = new PlainVanillaPayoff(type, strike);
    const bsProcess = new BlackScholesProcess(new Handle(underlying), flatRate, flatVol);
    const barrierEngine = new AnalyticBarrierEngine().init1(bsProcess);
    const europeanEngine = new AnalyticEuropeanEngine().init1(bsProcess);
    const referenceOption = new BarrierOption(barrierType, barrier, rebate, payoff, exercise);
    referenceOption.setPricingEngine(barrierEngine);
    let referenceValue = referenceOption.NPV();
    print('===========================================================================');
    print('Initial market conditions');
    print('===========================================================================');
    print('Option                                       NPV            Error');
    print('---------------------------------------------------------------------------');
    print(`Original barrier option                      ${referenceValue.toFixed(6)}       N/A`);
    const portfolio1 = new CompositeInstrument(), portfolio2 = new CompositeInstrument(), portfolio3 = new CompositeInstrument();
    const put1 = new EuropeanOption(payoff, exercise);
    put1.setPricingEngine(europeanEngine);
    portfolio1.add(put1);
    portfolio2.add(put1);
    portfolio3.add(put1);
    const digitalPayoff = new CashOrNothingPayoff(Option.Type.Put, barrier, 1.0);
    const digitalPut = new EuropeanOption(digitalPayoff, exercise);
    digitalPut.setPricingEngine(europeanEngine);
    portfolio1.subtract(digitalPut, strike - barrier);
    portfolio2.subtract(digitalPut, strike - barrier);
    portfolio3.subtract(digitalPut, strike - barrier);
    const lowerPayoff = new PlainVanillaPayoff(Option.Type.Put, barrier);
    const put2 = new EuropeanOption(lowerPayoff, exercise);
    put2.setPricingEngine(europeanEngine);
    portfolio1.subtract(put2);
    portfolio2.subtract(put2);
    portfolio3.subtract(put2);
    let i;
    for (i = 12; i >= 1; i--) {
        const innerMaturity = DateExt.advance(today, i, TimeUnit.Months);
        const innerExercise = new EuropeanExercise(innerMaturity);
        const innerPayoff = new PlainVanillaPayoff(Option.Type.Put, barrier);
        const putn = new EuropeanOption(innerPayoff, innerExercise);
        putn.setPricingEngine(europeanEngine);
        const killDate = DateExt.advance(today, i - 1, TimeUnit.Months);
        Settings.evaluationDate.set(killDate);
        underlying.setValue(barrier);
        const portfolioValue = portfolio1.NPV();
        const putValue = putn.NPV();
        const notional = portfolioValue / putValue;
        portfolio1.subtract(putn, notional);
    }
    Settings.evaluationDate.set(today);
    underlying.setValue(underlyingValue);
    let portfolioValue = portfolio1.NPV();
    let error = portfolioValue - referenceValue;
    print(`Replicating portfolio (12 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    for (i = 52; i >= 2; i -= 2) {
        const innerMaturity = DateExt.advance(today, i, TimeUnit.Weeks);
        const innerExercise = new EuropeanExercise(innerMaturity);
        const innerPayoff = new PlainVanillaPayoff(Option.Type.Put, barrier);
        const putn = new EuropeanOption(innerPayoff, innerExercise);
        putn.setPricingEngine(europeanEngine);
        const killDate = DateExt.advance(today, i - 2, TimeUnit.Weeks);
        Settings.evaluationDate.set(killDate);
        underlying.setValue(barrier);
        const portfolioValue = portfolio2.NPV();
        const putValue = putn.NPV();
        const notional = portfolioValue / putValue;
        portfolio2.subtract(putn, notional);
    }
    Settings.evaluationDate.set(today);
    underlying.setValue(underlyingValue);
    portfolioValue = portfolio2.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (26 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    for (i = 52; i >= 1; i--) {
        const innerMaturity = DateExt.advance(today, i, TimeUnit.Weeks);
        const innerExercise = new EuropeanExercise(innerMaturity);
        const innerPayoff = new PlainVanillaPayoff(Option.Type.Put, barrier);
        const putn = new EuropeanOption(innerPayoff, innerExercise);
        putn.setPricingEngine(europeanEngine);
        const killDate = DateExt.advance(today, i - 1, TimeUnit.Weeks);
        Settings.evaluationDate.set(killDate);
        underlying.setValue(barrier);
        const portfolioValue = portfolio3.NPV();
        const putValue = putn.NPV();
        const notional = portfolioValue / putValue;
        portfolio3.subtract(putn, notional);
    }
    Settings.evaluationDate.set(today);
    underlying.setValue(underlyingValue);
    portfolioValue = portfolio3.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (52 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    print('===========================================================================');
    print('Modified market conditions: out of the money');
    print('===========================================================================');
    print('Option                                       NPV            Error');
    print('---------------------------------------------------------------------------');
    underlying.setValue(110.0);
    referenceValue = referenceOption.NPV();
    print(`Original barrier option                      ${referenceValue.toFixed(6)}       N/A`);
    portfolioValue = portfolio1.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (12 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    portfolioValue = portfolio2.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (26 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    portfolioValue = portfolio3.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (52 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    print('===========================================================================');
    print('Option                                       NPV            Error');
    print('---------------------------------------------------------------------------');
    print('Modified market conditions: in the money');
    underlying.setValue(90.0);
    referenceValue = referenceOption.NPV();
    print(`Original barrier option                      ${referenceValue.toFixed(6)}       N/A`);
    portfolioValue = portfolio1.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (12 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    portfolioValue = portfolio2.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (26 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    portfolioValue = portfolio3.NPV();
    error = portfolioValue - referenceValue;
    print(`Replicating portfolio (52 dates)             ${portfolioValue.toFixed(6)}       ${error.toFixed(6)}`);
    print('===========================================================================');
    print('  ');
    print('The replication seems to be less robust when volatility and');
    print('risk-free rate are changed. Feel free to experiment with');
    print('the example and contribute a patch if you spot any errors.');

})