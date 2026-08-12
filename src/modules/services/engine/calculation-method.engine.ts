import { BadRequestException, Injectable } from '@nestjs/common';
import {
  SCOPE2_METHODOLOGY,
  Scope2MarketAllocation,
  Scope2QualityCriteriaValidation,
  Scope2Result,
} from './scope2-methodology.constants';

export type CalculationMethodKey =
  | 'FUEL_BASED'
  | 'DISTANCE_BASED'
  | 'SPEND_BASED'
  | 'LOCATION_BASED'
  | 'MARKET_BASED'
  | 'MASS_BASED'
  | 'EMPLOYEE_COMMUTING_BASED'
  | 'SUPPLIER_SPECIFIC'
  | 'HOTEL_STAY'
  | 'WASTEWATER_TREATMENT'
  | 'REFRIGERANT_BASED'
  | 'WASTE_DISPOSAL'
  | 'FREIGHT_BASED'
  | 'BUSINESS_TRAVEL_AIR'
  | 'BUSINESS_TRAVEL_LAND_SEA'
  | 'HOMEWORKING'
  | 'LEASED_ASSET'
  | 'PROCESS_EMISSION_BASED'
  | 'PURCHASED_STEAM'
  | 'PURCHASED_HEATING'
  | 'PURCHASED_COOLING'
  | 'WTT_BASED'
  | 'TRANSMISSION_DISTRIBUTION'
  | 'SOLD_PRODUCT_PROCESSING'
  | 'SOLD_PRODUCT_USE'
  | 'END_OF_LIFE'
  | 'FRANCHISE'
  | 'INVESTMENT_BASED';

export type FugitiveEmissionModeKey =
  | 'DIRECT_RELEASE'
  | 'RECHARGE_TOPUP'
  | 'INVENTORY_DIFFERENCE'
  | 'ESTIMATED_LEAKAGE';

export type EFTypeKey = 'CO2E' | 'GAS_SPECIFIC';
export type FactorBasisKey = 'CO2E_TOTAL' | 'CO2E_COMPONENT' | 'GAS_MASS';
export type FactorRepresentationKey = 'TOTAL' | 'GAS_COMPONENTS' | 'RAW_GAS';
export type MethaneOriginKey = 'FOSSIL' | 'NON_FOSSIL';
export type DistanceTypeKey = 'ONE_WAY' | 'ROUND_TRIP' | 'DAILY_TOTAL';

export interface CalculationInput {
  amount: number;
  ef: number;
  unit?: string;
  formula?: string;
  method?: string;
  activityCode?: string;
  distance?: number;
  weight?: number;
  spend?: number;
  employeeCount?: number;
  travelDays?: number;
  dailyDistance?: number;
  distanceType?: DistanceTypeKey;
  transportMode?: string;
  vehicleType?: string;
  radiativeForcingType?: string;
  treatmentMethod?: string;
  equityShare?: number;
  numberOfRooms?: number;
  numberOfNights?: number;
  wastewaterVolume?: number;
  numberSold?: number;
  lifetimeUses?: number;
  consumptionPerUse?: number;
  // Scope 1 Fugitive & Biogenic & Ownership extensions
  emissionMode?: FugitiveEmissionModeKey;
  isBiogenic?: boolean;
  ownershipControl?:
    'COMPANY_OWNED' | 'COMPANY_LEASED' | 'EMPLOYEE_OWNED' | 'THIRD_PARTY';
  rechargedAmount?: number;
  equipmentCapacity?: number;
  leakageRatePercent?: number;
  inventoryStart?: number;
  purchasedRefrigerant?: number;
  recoveredRefrigerant?: number;
  inventoryEnd?: number;
  // Factor Basis & Gas-specific parameters
  factorBasis?: FactorBasisKey;
  efType?: EFTypeKey;
  ch4Origin?: MethaneOriginKey;
  efCO2?: number;
  efCH4?: number;
  efN2O?: number;
  gwpSource?: string;
  gwpVersion?: string;
  gwpHorizon?: string;
  methodologyInputsSnapshot?: Record<string, any>;
  // Scope 2 Dual Accounting extensions
  marketAllocations?: Partial<Scope2MarketAllocation>[];
  residualMixEF?: number;
  locationEF?: number;
  contractualInstrumentType?: string;
  contractualInstrumentRef?: string;
  supplierName?: string;
  qualityCriteriaOverride?: Partial<Scope2QualityCriteriaValidation>;
}

export interface GasBreakdownResult {
  efType: EFTypeKey;
  factorBasis: FactorBasisKey;
  factorRepresentation: FactorRepresentationKey;
  gasBreakdownAvailable: boolean;
  ch4Origin?: MethaneOriginKey | null;
  gwpSource?: string | null;
  gwpVersion?: string | null;
  gwpHorizon?: string | null;
  gwpValuesSnapshot?: Record<string, number> | null;
  CO2?: number; // Stores tCO2e contribution when factorBasis is CO2E_COMPONENT or GAS_MASS
  CH4?: number; // Stores tCO2e contribution when factorBasis is CO2E_COMPONENT or GAS_MASS
  N2O?: number; // Stores tCO2e contribution when factorBasis is CO2E_COMPONENT or GAS_MASS
  HFC?: number;
  PFC?: number;
  SF6?: number;
  NF3?: number;
}

export interface CalculationResult {
  emission: number; // In Metric Tonnes CO2e (tCO2e)
  fossilEmission: number; // Fossil GHG in tCO2e (Scope 1 gross)
  biogenicEmission: number; // Biogenic CO2 in tCO2e (reported as memo outside gross Scope 1)
  derivedAmount: number; // Final activity amount used in multiplication
  exactEF: number; // Stored exact factor precision (e.g. 0.17701 for component sum)
  calculationEngineVersion: string; // Algorithm version snapshot (1.0.0)
  methodUsed: CalculationMethodKey;
  formulaApplied: string;
  gasBreakdown: GasBreakdownResult;
  inputsSnapshot: Record<string, any>;
  scope2Result?: Scope2Result;
}

@Injectable()
export class CalculationMethodEngine {
  public static readonly ENGINE_VERSION = '1.0.0';

  /**
   * Authoritative 100-Year Global Warming Potential (GWP-100) Multipliers
   * - IPCC AR6 WG1 (2021 Physical Science Basis, Chapter 7 Table 7.SM.7)
   * - IPCC AR5 WG1 (2013 Assessment, Chapter 8 Table 8.SM.16)
   * - IPCC AR4 WG1 (2007 Assessment, Chapter 2 Table 2.14 / Legacy regulatory baseline)
   * - Referenced in GHG Protocol Corporate Standard Guidance (August 2024 update)
   */
  private readonly GWP_DATABASE = {
    AR6: {
      '100Y': {
        CO2: 1,
        CH4_FOSSIL: 29.8,
        CH4_NON_FOSSIL: 27.0,
        N2O: 273,
        SF6: 24300,
        NF3: 17400,
        HFC32: 771,
        HFC125: 3740,
        HFC134A: 1526,
        HFC143A: 4800,
        R410A: 2256, // 50% HFC-32 (771) + 50% HFC-125 (3740) = 2255.5 ≈ 2256
        R404A: 4203, // 44% HFC-125 (3740) + 52% HFC-143a (4800) + 4% HFC-134a (1526) = 4202.64 ≈ 4203
      },
    },
    AR5: {
      '100Y': {
        CO2: 1,
        CH4_FOSSIL: 30.0,
        CH4_NON_FOSSIL: 28.0,
        N2O: 265,
        SF6: 23500,
        NF3: 16100,
        HFC32: 675,
        HFC125: 3170,
        HFC134A: 1430,
        HFC143A: 4180,
        R410A: 1923, // 50% HFC-32 (675) + 50% HFC-125 (3170) = 1922.5 ≈ 1923
        R404A: 3922, // 44% HFC-125 (3170) + 52% HFC-143a (4180) + 4% HFC-134a (1430) = 3925.6 ≈ 3926 (or 3922 legacy blend)
      },
    },
    AR4: {
      '100Y': {
        CO2: 1,
        CH4_FOSSIL: 25.0,
        CH4_NON_FOSSIL: 25.0,
        N2O: 298,
        SF6: 22800,
        NF3: 17200,
        HFC32: 675,
        HFC125: 3500,
        HFC134A: 1300,
        HFC143A: 4470,
        R410A: 2088, // 50% HFC-32 (675) + 50% HFC-125 (3500) = 2087.5 ≈ 2088
        R404A: 3922, // 44% HFC-125 (3500) + 52% HFC-143a (4470) + 4% HFC-134a (1300) = 3922
      },
    },
  };

  /**
   * Routes activity inputs dynamically based on the category calculation method
   */
  calculateEmission(input: CalculationInput): CalculationResult {
    const amountVal = Number(input.amount) || 0;
    const factorVal = Number(input.ef) || 0;
    const rawMethod = (input.method || 'FUEL_BASED').toUpperCase().trim();

    let methodKey: CalculationMethodKey = 'FUEL_BASED';

    if (rawMethod.includes('HOTEL')) methodKey = 'HOTEL_STAY';
    else if (rawMethod.includes('WASTEWATER'))
      methodKey = 'WASTEWATER_TREATMENT';
    else if (
      rawMethod.includes('REFRIGERANT') ||
      rawMethod.includes('FUGITIVE')
    )
      methodKey = 'REFRIGERANT_BASED';
    else if (
      rawMethod.includes('WASTE_DISPOSAL') ||
      rawMethod.includes('LANDFILL') ||
      rawMethod.includes('RECYCLING')
    )
      methodKey = 'WASTE_DISPOSAL';
    else if (
      rawMethod.includes('END_OF_LIFE') ||
      rawMethod.includes('END OF LIFE') ||
      rawMethod === 'EOL'
    )
      methodKey = 'END_OF_LIFE';
    else if (rawMethod.includes('FREIGHT')) methodKey = 'FREIGHT_BASED';
    // IMPORTANT: BUSINESS_TRAVEL_AIR must be evaluated BEFORE generic transport-mode keywords
    // because 'BUSINESS_TRAVEL_AIR' contains 'BUS' which would otherwise match LAND_SEA.
    else if (
      rawMethod === 'BUSINESS_TRAVEL_AIR' ||
      rawMethod.includes('FLIGHT') ||
      rawMethod.includes('AVIATION')
    )
      methodKey = 'BUSINESS_TRAVEL_AIR';
    else if (
      rawMethod === 'BUSINESS_TRAVEL_LAND_SEA' ||
      rawMethod.includes('LAND_SEA') ||
      rawMethod.includes('RAIL') ||
      rawMethod.includes('FERRY') ||
      rawMethod === 'BUS' ||
      rawMethod === 'CAR'
    )
      methodKey = 'BUSINESS_TRAVEL_LAND_SEA';
    else if (
      rawMethod.includes('HOMEWORKING') ||
      rawMethod.includes('REMOTE_WORK')
    )
      methodKey = 'HOMEWORKING';
    else if (rawMethod.includes('LEASED')) methodKey = 'LEASED_ASSET';
    else if (rawMethod.includes('FRANCHISE')) methodKey = 'FRANCHISE';
    else if (rawMethod.includes('INVESTMENT')) methodKey = 'INVESTMENT_BASED';
    else if (
      rawMethod.includes('SOLD_PRODUCT_PROCESSING') ||
      rawMethod.includes('PROCESSING_SOLD')
    )
      methodKey = 'SOLD_PRODUCT_PROCESSING';
    else if (
      rawMethod.includes('SOLD_PRODUCT_USE') ||
      rawMethod.includes('USE_SOLD')
    )
      methodKey = 'SOLD_PRODUCT_USE';
    else if (
      rawMethod.includes('PROCESS_EMISSION') ||
      rawMethod.includes('PROCESS EMISSION')
    )
      methodKey = 'PROCESS_EMISSION_BASED';
    else if (rawMethod.includes('PURCHASED_STEAM') || rawMethod === 'STEAM')
      methodKey = 'PURCHASED_STEAM';
    else if (rawMethod.includes('PURCHASED_HEATING') || rawMethod === 'HEATING')
      methodKey = 'PURCHASED_HEATING';
    else if (rawMethod.includes('PURCHASED_COOLING') || rawMethod === 'COOLING')
      methodKey = 'PURCHASED_COOLING';
    else if (
      rawMethod.includes('WTT') ||
      rawMethod.includes('WELL_TO_TANK') ||
      rawMethod.includes('WELL-TO-TANK')
    )
      methodKey = 'WTT_BASED';
    else if (
      rawMethod.includes('TRANSMISSION') ||
      rawMethod.includes('T&D') ||
      rawMethod.includes('TD_LOSS')
    )
      methodKey = 'TRANSMISSION_DISTRIBUTION';
    else if (rawMethod.includes('COMMUTING') || rawMethod.includes('EMPLOYEE'))
      methodKey = 'EMPLOYEE_COMMUTING_BASED';
    else if (rawMethod.includes('DISTANCE')) methodKey = 'DISTANCE_BASED';
    else if (rawMethod.includes('SPEND')) methodKey = 'SPEND_BASED';
    else if (rawMethod.includes('LOCATION')) methodKey = 'LOCATION_BASED';
    else if (rawMethod.includes('MARKET')) methodKey = 'MARKET_BASED';
    else if (rawMethod.includes('MASS')) methodKey = 'MASS_BASED';
    else if (rawMethod.includes('SUPPLIER')) methodKey = 'SUPPLIER_SPECIFIC';

    let totalEmission = 0;
    let derivedAmount = amountVal;
    let formulaApplied = '';
    const snapshot: Record<string, any> = input.methodologyInputsSnapshot
      ? { ...input.methodologyInputsSnapshot }
      : {};

    switch (methodKey) {
      case 'HOTEL_STAY': {
        const rooms = Number(
          input.numberOfRooms || snapshot.numberOfRooms || 1,
        );
        const nights = Number(
          input.numberOfNights || snapshot.numberOfNights || amountVal,
        );
        derivedAmount = Number((rooms * nights).toFixed(4));
        totalEmission = Number(((derivedAmount * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Rooms [${rooms}] × Nights [${nights}] = ${derivedAmount} room-nights) × Hotel_EF [${factorVal}] / 1000 = ${totalEmission} tCO2e`;

        snapshot.numberOfRooms = rooms;
        snapshot.numberOfNights = nights;
        snapshot.derivedRoomNights = derivedAmount;
        break;
      }

      case 'WASTEWATER_TREATMENT': {
        const vol = Number(
          input.wastewaterVolume || snapshot.wastewaterVolume || amountVal,
        );
        derivedAmount = vol;
        totalEmission = Number(((vol * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Wastewater Volume [${vol} m³] × Wastewater_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;

        snapshot.wastewaterVolume = vol;
        if (input.treatmentMethod || snapshot.treatmentMethod)
          snapshot.treatmentMethod =
            input.treatmentMethod || snapshot.treatmentMethod;
        break;
      }

      case 'EMPLOYEE_COMMUTING_BASED': {
        const distType: DistanceTypeKey =
          input.distanceType || snapshot.distanceType;
        if (!distType) {
          throw new BadRequestException(
            'distanceType (ONE_WAY, ROUND_TRIP, or DAILY_TOTAL) is required for employee commuting calculation',
          );
        }

        const employees = Number(
          input.employeeCount || snapshot.employeeCount || 1,
        );
        const days = Number(input.travelDays || snapshot.travelDays || 1);
        const rawDistance = Number(
          input.dailyDistance || snapshot.dailyDistance || amountVal,
        );

        // GHG Protocol Category 7: ONE_WAY distance requires x2 multiplier for round trip
        const effectiveDailyDistance =
          distType === 'ONE_WAY' ? rawDistance * 2 : rawDistance;

        derivedAmount = Number(
          (employees * days * effectiveDailyDistance).toFixed(4),
        );
        totalEmission = Number(((derivedAmount * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Employees [${employees}] × Days [${days}] × DailyDist [${rawDistance} km ${distType} → ${effectiveDailyDistance} km round-trip] = ${derivedAmount} p-km) × EF [${factorVal}] / 1000 = ${totalEmission} tCO2e`;

        snapshot.employeeCount = employees;
        snapshot.travelDays = days;
        snapshot.dailyDistance = rawDistance;
        snapshot.distanceType = distType;
        snapshot.derivedPassengerKm = derivedAmount;
        break;
      }

      case 'DISTANCE_BASED': {
        const dist = Number(input.distance || snapshot.distance || amountVal);
        const weight = Number(input.weight || snapshot.weight || 1.0);
        derivedAmount = Number((dist * weight).toFixed(4));
        totalEmission = Number(((derivedAmount * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Distance [${dist}] × Weight [${weight}] = ${derivedAmount} t-km) × EF [${factorVal}] / 1000 = ${totalEmission} tCO2e`;

        snapshot.distance = dist;
        snapshot.weight = weight;
        if (input.transportMode || snapshot.transportMode)
          snapshot.transportMode =
            input.transportMode || snapshot.transportMode;
        if (input.radiativeForcingType || snapshot.radiativeForcingType)
          snapshot.radiativeForcingType =
            input.radiativeForcingType || snapshot.radiativeForcingType;
        break;
      }

      case 'SPEND_BASED': {
        const spendVal = Number(input.spend || snapshot.spend || amountVal);
        derivedAmount = spendVal;
        totalEmission = Number(((spendVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Spend [${spendVal}] × EEIO_Factor [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        snapshot.spendAmount = spendVal;
        break;
      }

      case 'LOCATION_BASED': {
        derivedAmount = amountVal;
        const scope2Res = this.calculateScope2DualOutput(
          input,
          amountVal,
          factorVal,
          'LOCATION_BASED',
        );
        totalEmission = scope2Res.locationBased.tonnesCO2e;
        formulaApplied = scope2Res.locationBased.formula;
        snapshot.scope2Result = scope2Res;
        break;
      }

      case 'MARKET_BASED': {
        derivedAmount = amountVal;
        const scope2Res = this.calculateScope2DualOutput(
          input,
          amountVal,
          factorVal,
          'MARKET_BASED',
        );
        totalEmission = scope2Res.marketBased.tonnesCO2e;
        formulaApplied = scope2Res.marketBased.formula;
        snapshot.scope2Result = scope2Res;
        break;
      }

      case 'MASS_BASED': {
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Mass [${amountVal} kg] × EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        if (input.treatmentMethod || snapshot.treatmentMethod)
          snapshot.treatmentMethod =
            input.treatmentMethod || snapshot.treatmentMethod;
        break;
      }

      case 'REFRIGERANT_BASED': {
        const mode: FugitiveEmissionModeKey =
          input.emissionMode ||
          snapshot.emissionMode ||
          (input.equipmentCapacity != null ||
          snapshot.equipmentCapacity != null ||
          input.leakageRatePercent != null
            ? 'ESTIMATED_LEAKAGE'
            : 'DIRECT_RELEASE');

        if (mode === 'RECHARGE_TOPUP') {
          const rechargeVal = Number(
            input.rechargedAmount ?? snapshot.rechargedAmount ?? amountVal,
          );
          derivedAmount = rechargeVal;
          totalEmission = Number(((rechargeVal * factorVal) / 1000).toFixed(6));
          formulaApplied = `(Refrigerant Top-up / Recharge [${rechargeVal} kg] × GWP [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
          snapshot.rechargedAmount = rechargeVal;
          snapshot.emissionMode = 'RECHARGE_TOPUP';
        } else if (mode === 'INVENTORY_DIFFERENCE') {
          const startVal = Number(
            input.inventoryStart ?? snapshot.inventoryStart ?? 0,
          );
          const purchasedVal = Number(
            input.purchasedRefrigerant ?? snapshot.purchasedRefrigerant ?? 0,
          );
          const recoveredVal = Number(
            input.recoveredRefrigerant ?? snapshot.recoveredRefrigerant ?? 0,
          );
          const endVal = Number(
            input.inventoryEnd ?? snapshot.inventoryEnd ?? 0,
          );
          derivedAmount = Number(
            (startVal + purchasedVal - recoveredVal - endVal).toFixed(4),
          );

          if (derivedAmount < 0) {
            throw new BadRequestException(
              `Fugitive inventory difference resulted in negative emitted mass (${derivedAmount} kg). Ending inventory [${endVal} kg] + Recovered [${recoveredVal} kg] exceeds Beginning inventory [${startVal} kg] + Purchased [${purchasedVal} kg]. Please verify balance entries.`,
            );
          }

          totalEmission = Number(
            ((derivedAmount * factorVal) / 1000).toFixed(6),
          );
          formulaApplied = `(Start [${startVal} kg] + Purchased [${purchasedVal} kg] - Recovered [${recoveredVal} kg] - End [${endVal} kg] = ${derivedAmount} kg) × GWP [${factorVal}] / 1000 = ${totalEmission} tCO2e`;
          snapshot.inventoryStart = startVal;
          snapshot.purchasedRefrigerant = purchasedVal;
          snapshot.recoveredRefrigerant = recoveredVal;
          snapshot.inventoryEnd = endVal;
          snapshot.emissionMode = 'INVENTORY_DIFFERENCE';
        } else if (mode === 'ESTIMATED_LEAKAGE') {
          const capVal = Number(
            input.equipmentCapacity ?? snapshot.equipmentCapacity ?? amountVal,
          );
          let rawRate = Number(
            input.leakageRatePercent ??
              snapshot.leakageRatePercent ??
              snapshot.leakageRate ??
              0.05,
          );

          // Auto-normalize percentage vs fraction representation: 5 -> 0.05
          if (rawRate > 1 && rawRate <= 100) {
            rawRate = rawRate / 100;
          } else if (rawRate <= 0 || rawRate > 100) {
            throw new BadRequestException(
              `Leakage rate must be between 0% and 100% (got ${rawRate}).`,
            );
          }

          derivedAmount = Number((capVal * rawRate).toFixed(4));
          totalEmission = Number(
            ((derivedAmount * factorVal) / 1000).toFixed(6),
          );
          formulaApplied = `(Equipment Capacity [${capVal} kg] × Leakage Rate [${(rawRate * 100).toFixed(2)}%] = ${derivedAmount} kg) × GWP [${factorVal}] / 1000 = ${totalEmission} tCO2e`;
          snapshot.equipmentCapacity = capVal;
          snapshot.leakageRatePercent = rawRate;
          snapshot.leakageRate = rawRate;
          snapshot.emissionMode = 'ESTIMATED_LEAKAGE';
        } else {
          // DIRECT_RELEASE or fallback
          derivedAmount = amountVal;
          totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
          formulaApplied = `(Direct Refrigerant Released [${amountVal} kg] × GWP/EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
          snapshot.emissionMode = 'DIRECT_RELEASE';
        }
        break;
      }

      case 'WASTE_DISPOSAL': {
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Waste Amount [${amountVal}] × Waste_Disposal_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        if (input.treatmentMethod || snapshot.treatmentMethod)
          snapshot.treatmentMethod =
            input.treatmentMethod || snapshot.treatmentMethod;
        break;
      }

      case 'FREIGHT_BASED': {
        const distVal = Number(input.distance || snapshot.distance || 1);
        const weightVal = Number(input.weight || snapshot.weight || amountVal);
        derivedAmount = weightVal * distVal;
        totalEmission = Number(((derivedAmount * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Weight [${weightVal}] × Distance [${distVal}] × Freight_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        snapshot.distance = distVal;
        snapshot.weight = weightVal;
        break;
      }

      case 'BUSINESS_TRAVEL_AIR': {
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Passenger Distance [${amountVal} p-km] × Air_Travel_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }

      case 'HOMEWORKING': {
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Homeworking Hours [${amountVal} hrs] × Homeworking_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }

      case 'LEASED_ASSET': {
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Leased Asset Usage [${amountVal}] × Asset_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }

      case 'BUSINESS_TRAVEL_LAND_SEA': {
        // Cat 6: Land/Sea travel — passenger-km × EF
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Passenger-km [${amountVal}] × Land_Sea_Travel_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        if (input.transportMode || snapshot.transportMode)
          snapshot.transportMode =
            input.transportMode || snapshot.transportMode;
        break;
      }

      case 'PROCESS_EMISSION_BASED': {
        // S1 Process emissions: quantity (kg) × process EF
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Process Quantity [${amountVal} kg] × Process_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        if (input.transportMode || snapshot.transportMode)
          snapshot.transportMode =
            input.transportMode || snapshot.transportMode; // reused for emissionSource
        break;
      }

      case 'PURCHASED_STEAM': {
        // S2 Purchased steam: quantity (GJ, MWh, or steam mass tonnes) × steam EF
        derivedAmount = amountVal;
        const scope2Res = this.calculateScope2DualOutput(
          input,
          amountVal,
          factorVal,
          'PURCHASED_STEAM',
        );
        totalEmission = scope2Res.locationBased.tonnesCO2e;
        formulaApplied = scope2Res.locationBased.formula;
        snapshot.scope2Result = scope2Res;
        break;
      }

      case 'PURCHASED_HEATING': {
        // S2 Purchased heating: quantity (GJ or MWh) × heat EF
        derivedAmount = amountVal;
        const scope2Res = this.calculateScope2DualOutput(
          input,
          amountVal,
          factorVal,
          'PURCHASED_HEATING',
        );
        totalEmission = scope2Res.locationBased.tonnesCO2e;
        formulaApplied = scope2Res.locationBased.formula;
        snapshot.scope2Result = scope2Res;
        break;
      }

      case 'PURCHASED_COOLING': {
        // S2 Purchased cooling: quantity (GJ or MWh) × cool EF
        derivedAmount = amountVal;
        const scope2Res = this.calculateScope2DualOutput(
          input,
          amountVal,
          factorVal,
          'PURCHASED_COOLING',
        );
        totalEmission = scope2Res.locationBased.tonnesCO2e;
        formulaApplied = scope2Res.locationBased.formula;
        snapshot.scope2Result = scope2Res;
        break;
      }

      case 'WTT_BASED': {
        // S3 Cat 3: Well-to-Tank upstream emissions for fuel/energy
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Fuel/Energy Quantity [${amountVal}] × WTT_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }

      case 'TRANSMISSION_DISTRIBUTION': {
        // S3 Cat 3: Transmission & Distribution losses on purchased electricity
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Electricity [${amountVal} kWh] × T&D_Loss_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }

      case 'SOLD_PRODUCT_PROCESSING': {
        // Cat 10: Energy/fuel consumed during downstream processing of sold products
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Processing Energy [${amountVal}] × Processing_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }

      case 'SOLD_PRODUCT_USE': {
        // Cat 11: Number sold × lifetime uses × consumption per use × EF
        const numSold = Number(input.numberSold || snapshot.numberSold || 1);
        const lifetimeUses = Number(
          input.lifetimeUses || snapshot.lifetimeUses || 1,
        );
        const perUse = Number(
          input.consumptionPerUse || snapshot.consumptionPerUse || amountVal,
        );
        derivedAmount = Number((numSold * lifetimeUses * perUse).toFixed(4));
        totalEmission = Number(((derivedAmount * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Sold [${numSold}] × Lifetime Uses [${lifetimeUses}] × Per-Use Consumption [${perUse}] = ${derivedAmount}) × Use_EF [${factorVal}] / 1000 = ${totalEmission} tCO2e`;
        snapshot.numberSold = numSold;
        snapshot.lifetimeUses = lifetimeUses;
        snapshot.consumptionPerUse = perUse;
        break;
      }

      case 'END_OF_LIFE': {
        // Cat 12: Total product mass × waste treatment EF (distinct context from Cat 5)
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Product Mass [${amountVal} kg] × End-of-Life_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e (Cat 12 — downstream end-of-life, not Cat 5 operational waste)`;
        if (input.treatmentMethod || snapshot.treatmentMethod)
          snapshot.treatmentMethod =
            input.treatmentMethod || snapshot.treatmentMethod;
        break;
      }

      case 'FRANCHISE': {
        // Cat 14: Franchise Scope 1+2 proxy reporting. amount = total franchisee kWh/fuel
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Franchise Activity [${amountVal}] × Franchise_EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }

      case 'INVESTMENT_BASED': {
        // Cat 15: Equity or project-finance. amount = attributed revenue/cost
        const equityPct = Number(
          input.equityShare || snapshot.equityShare || 1.0,
        );
        derivedAmount = Number((amountVal * equityPct).toFixed(4));
        totalEmission = Number(((derivedAmount * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Investee Attribution [${amountVal} × Equity ${equityPct}] = ${derivedAmount}) × Investment_EF [${factorVal}] / 1000 = ${totalEmission} tCO2e`;
        snapshot.equityShare = equityPct;
        break;
      }

      case 'FUEL_BASED':
      default: {
        derivedAmount = amountVal;
        totalEmission = Number(((amountVal * factorVal) / 1000).toFixed(6));
        formulaApplied = `(Amount [${amountVal}] × EF [${factorVal}]) / 1000 = ${totalEmission} tCO2e`;
        break;
      }
    }

    // Determine Factor Basis & Gas Species Resolution
    const basis: FactorBasisKey =
      input.factorBasis ||
      (input.efCO2 != null || input.efCH4 != null ? 'GAS_MASS' : 'CO2E_TOTAL');
    let exactEF = factorVal;
    let gasBreakdown: GasBreakdownResult;

    if (basis === 'CO2E_COMPONENT') {
      // DEFRA 2025 style: Gas factors are already expressed in kg CO2e per unit. DO NOT apply GWP again!
      const co2Ef = Number(input.efCO2 || 0);
      const ch4Ef = Number(input.efCH4 || 0);
      const n2oEf = Number(input.efN2O || 0);

      const co2Tonnes = Number(((derivedAmount * co2Ef) / 1000).toFixed(6));
      const ch4Tonnes = Number(((derivedAmount * ch4Ef) / 1000).toFixed(6));
      const n2oTonnes = Number(((derivedAmount * n2oEf) / 1000).toFixed(6));

      // Exact component EF precision
      const componentSumEf = Number((co2Ef + ch4Ef + n2oEf).toFixed(6));
      if (componentSumEf > 0) {
        exactEF = componentSumEf;
      }

      // Component sum calculation matches exact gas species breakdown
      const componentSumEmission = Number(
        (co2Tonnes + ch4Tonnes + n2oTonnes).toFixed(6),
      );
      if (componentSumEmission > 0) {
        totalEmission = componentSumEmission;
      }

      gasBreakdown = {
        efType: 'GAS_SPECIFIC',
        factorBasis: 'CO2E_COMPONENT',
        factorRepresentation: 'GAS_COMPONENTS',
        gasBreakdownAvailable: true,
        ch4Origin: null, // Pre-converted into CO2e by dataset provider (no GWP origin selection required)
        gwpSource: input.gwpSource || 'DEFRA Pre-Converted CO2e',
        gwpVersion: input.gwpVersion || 'DEFRA 2025',
        gwpHorizon: '100Y',
        gwpValuesSnapshot: null, // GWP already embedded by dataset provider
        CO2: co2Tonnes,
        CH4: ch4Tonnes,
        N2O: n2oTonnes,
      };
    } else if (basis === 'GAS_MASS') {
      // Raw Gas Masses (kg CH4 / L, kg N2O / L): GWP conversion REQUIRED
      if (input.efCH4 != null && input.efCH4 > 0 && !input.ch4Origin) {
        throw new BadRequestException(
          'ch4Origin (FOSSIL or NON_FOSSIL) is required when CH4 emission factor is specified under GAS_MASS factor basis',
        );
      }

      const version = input.gwpVersion || 'AR6';
      const horizon = input.gwpHorizon || '100Y';
      const ch4Origin = input.ch4Origin || 'FOSSIL';

      const co2Multiplier = 1.0;
      const ch4Multiplier =
        ch4Origin === 'NON_FOSSIL'
          ? this.GWP_DATABASE[version]?.[horizon]?.CH4_NON_FOSSIL || 27.0
          : this.GWP_DATABASE[version]?.[horizon]?.CH4_FOSSIL || 29.8;
      const n2oMultiplier = this.GWP_DATABASE[version]?.[horizon]?.N2O || 273;

      const co2Ef = Number(input.efCO2 || 0);
      const ch4Ef = Number(input.efCH4 || 0);
      const n2oEf = Number(input.efN2O || 0);

      const co2Tonnes = Number(
        ((derivedAmount * co2Ef * co2Multiplier) / 1000).toFixed(6),
      );
      const ch4Tonnes = Number(
        ((derivedAmount * ch4Ef * ch4Multiplier) / 1000).toFixed(6),
      );
      const n2oTonnes = Number(
        ((derivedAmount * n2oEf * n2oMultiplier) / 1000).toFixed(6),
      );

      const rawGasSumEmission = Number(
        (co2Tonnes + ch4Tonnes + n2oTonnes).toFixed(6),
      );
      if (rawGasSumEmission > 0) {
        totalEmission = rawGasSumEmission;
      }

      gasBreakdown = {
        efType: 'GAS_SPECIFIC',
        factorBasis: 'GAS_MASS',
        factorRepresentation: 'RAW_GAS',
        gasBreakdownAvailable: true,
        ch4Origin,
        gwpSource: input.gwpSource || 'IPCC AR6',
        gwpVersion: version,
        gwpHorizon: horizon,
        gwpValuesSnapshot: {
          CO2: co2Multiplier,
          CH4: ch4Multiplier,
          N2O: n2oMultiplier,
        },
        CO2: co2Tonnes,
        CH4: ch4Tonnes,
        N2O: n2oTonnes,
      };
    } else {
      // Single CO2e EF (CO2E_TOTAL). Do NOT infer fake gas percentages or attach GWP metadata!
      gasBreakdown = {
        efType: 'CO2E',
        factorBasis: 'CO2E_TOTAL',
        factorRepresentation: 'TOTAL',
        gasBreakdownAvailable: false,
        gwpSource: null,
        gwpVersion: null,
        gwpHorizon: null,
        gwpValuesSnapshot: null,
      };
    }

    /**
     * GHG Protocol Corporate Standard (Chapter 9) Biogenic Carbon Isolation:
     * - Biogenic CO₂ is reported outside Scope 1 as an informational memo line (biogenicEmission).
     * - Combustion CH₄ and N₂O remain inside the reportable Scope 1 total (fossilEmission / emission).
     */
    const isBiogenic = Boolean(input.isBiogenic || snapshot.isBiogenic);
    let biogenicEmission = 0;
    let fossilEmission = totalEmission;

    if (isBiogenic) {
      if (gasBreakdown.gasBreakdownAvailable && gasBreakdown.CO2 != null) {
        biogenicEmission = gasBreakdown.CO2;
        // Scope 1 gross reportable emission excludes biogenic CO2 per GHG Protocol Standard
        fossilEmission = Number((totalEmission - gasBreakdown.CO2).toFixed(6));
        totalEmission = fossilEmission;
      } else {
        biogenicEmission = totalEmission;
        fossilEmission = 0;
        totalEmission = 0;
      }
      snapshot.isBiogenic = true;
      snapshot.biogenicEmission = biogenicEmission;
      snapshot.fossilEmission = fossilEmission;
      snapshot.scope1ReportableEmission = totalEmission;
    }

    return {
      emission: totalEmission,
      fossilEmission,
      biogenicEmission,
      derivedAmount,
      exactEF,
      calculationEngineVersion: CalculationMethodEngine.ENGINE_VERSION,
      methodUsed: methodKey,
      formulaApplied,
      gasBreakdown,
      inputsSnapshot: snapshot,
      scope2Result: snapshot.scope2Result,
    };
  }

  private calculateScope2DualOutput(
    input: CalculationInput,
    amountVal: number,
    factorVal: number,
    methodKey: CalculationMethodKey,
  ): Scope2Result {
    const isSteam = methodKey === 'PURCHASED_STEAM';
    const isHeating = methodKey === 'PURCHASED_HEATING';
    const isCooling = methodKey === 'PURCHASED_COOLING';

    let energyType: 'ELECTRICITY' | 'STEAM' | 'HEATING' | 'COOLING' =
      'ELECTRICITY';
    if (isSteam) energyType = 'STEAM';
    else if (isHeating) energyType = 'HEATING';
    else if (isCooling) energyType = 'COOLING';

    const locationEF = input.locationEF ?? factorVal;
    const locationTonnes = Number(((amountVal * locationEF) / 1000).toFixed(6));
    const locationKg = Number((locationTonnes * 1000).toFixed(2));
    const locationFormula = `(Energy/Steam Amount [${amountVal} ${input.unit || 'kWh'}] × Location_EF [${locationEF}]) / 1000 = ${locationTonnes} tCO2e`;

    const rawAllocations = input.marketAllocations || [];
    const totalAllocatedQty = rawAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedQuantity || 0),
      0,
    );

    if (totalAllocatedQty > amountVal + 0.00001) {
      throw new BadRequestException(
        `Market-based allocation total (${totalAllocatedQty} ${input.unit || 'kWh'}) exceeds activity consumption quantity (${amountVal} ${input.unit || 'kWh'}). Allocation conservation invariant violated.`,
      );
    }

    const residualEF = input.residualMixEF ?? locationEF;
    const finalAllocations: Scope2MarketAllocation[] = [];
    let marketTonnesSum = 0;
    let allQualityPassed = true;

    for (const alloc of rawAllocations) {
      const qty = Number(alloc.allocatedQuantity || 0);
      if (qty <= 0) continue;

      const qc: Scope2QualityCriteriaValidation = {
        conveysEmissionRate: alloc.qualityCriteria?.conveysEmissionRate ?? true,
        uniqueClaims: alloc.qualityCriteria?.uniqueClaims ?? true,
        retiredOrCancelled: alloc.qualityCriteria?.retiredOrCancelled ?? true,
        temporalMatching: alloc.qualityCriteria?.temporalMatching ?? true,
        geographicBoundary: alloc.qualityCriteria?.geographicBoundary ?? true,
        supplierSourceValid: alloc.qualityCriteria?.supplierSourceValid ?? true,
        factorAccuracy: alloc.qualityCriteria?.factorAccuracy ?? true,
        evidenceAuditability:
          alloc.qualityCriteria?.evidenceAuditability ??
          Boolean(alloc.evidenceRef || alloc.instrumentRef),
      };

      const qcMet = Object.values(qc).every(Boolean);
      if (!qcMet) allQualityPassed = false;

      const effectiveFactor = qcMet ? Number(alloc.factor ?? 0) : residualEF;
      const allocTonnes = Number(((qty * effectiveFactor) / 1000).toFixed(6));
      marketTonnesSum += allocTonnes;

      finalAllocations.push({
        instrumentType:
          alloc.instrumentType || (qcMet ? 'PPA' : 'RESIDUAL_MIX'),
        instrumentRef: alloc.instrumentRef,
        supplierName: alloc.supplierName,
        allocatedQuantity: qty,
        allocatedUnit: alloc.allocatedUnit || input.unit || 'kWh',
        factor: effectiveFactor,
        emissionTonnes: allocTonnes,
        qualityCriteria: qc,
        qualityCriteriaMet: qcMet,
        evidenceRef: alloc.evidenceRef,
      });
    }

    const unallocatedQty = Number(
      Math.max(0, amountVal - totalAllocatedQty).toFixed(4),
    );
    if (unallocatedQty > 0 || finalAllocations.length === 0) {
      const resTonnes = Number(
        ((unallocatedQty * residualEF) / 1000).toFixed(6),
      );
      marketTonnesSum += resTonnes;
      const defaultQC: Scope2QualityCriteriaValidation = {
        conveysEmissionRate: true,
        uniqueClaims: true,
        retiredOrCancelled: true,
        temporalMatching: true,
        geographicBoundary: true,
        supplierSourceValid: true,
        factorAccuracy: true,
        evidenceAuditability: true,
      };
      finalAllocations.push({
        instrumentType:
          unallocatedQty === amountVal
            ? 'RESIDUAL_MIX'
            : 'GRID_AVERAGE_FALLBACK',
        allocatedQuantity: unallocatedQty,
        allocatedUnit: input.unit || 'kWh',
        factor: residualEF,
        emissionTonnes: resTonnes,
        qualityCriteria: defaultQC,
        qualityCriteriaMet: true,
      });
    }

    const marketTonnes = Number(marketTonnesSum.toFixed(6));
    const marketKg = Number((marketTonnes * 1000).toFixed(2));
    const marketFormula = `(Market Allocations [${finalAllocations.length} instruments] Total) = ${marketTonnes} tCO2e`;

    return {
      methodologyVersion: `${SCOPE2_METHODOLOGY.guidance}_v${SCOPE2_METHODOLOGY.implementation}`,
      energyType,
      locationBased: {
        kgCO2e: locationKg,
        tonnesCO2e: locationTonnes,
        factor: locationEF,
        efSource: input.gwpSource || 'Grid Location Factor',
        formula: locationFormula,
      },
      marketBased: {
        kgCO2e: marketKg,
        tonnesCO2e: marketTonnes,
        factorAllocations: finalAllocations,
        qualityCriteriaPassed: allQualityPassed,
        residualMixUsed: unallocatedQty > 0,
        unallocatedQuantity: unallocatedQty,
        formula: marketFormula,
      },
    };
  }
}
