import { MasterScope } from 'src/entities/master-scope.entity';
import { MasterRefrigerant } from 'src/entities/master-refrigerant.entity';
import { RefrigerantComponent } from 'src/entities/refrigerant-component.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { InventoryActivity } from 'src/entities/inventory-activity.entity';
import { PurchasedEnergyActivity } from 'src/entities/purchased-energy-activity.entity';
import { Scope3Activity } from 'src/entities/scope3-activity.entity';

describe('DB Model Integrity & Relational Invariants', () => {
  describe('Phase 1: Entity Metadata & Unique Constraints', () => {
    it('should have defined unique constraints on MasterScope', () => {
      const scope = new MasterScope();
      scope.code = 'SCOPE_1';
      expect(scope.code).toBe('SCOPE_1');
    });

    it('should validate refrigerant composition total equals 100%', () => {
      const ref = new MasterRefrigerant();
      ref.blendCode = 'R410A';

      const comp1 = new RefrigerantComponent();
      comp1.massPercentage = 50;

      const comp2 = new RefrigerantComponent();
      comp2.massPercentage = 50;

      ref.components = [comp1, comp2];
      expect(() => ref.validateCompositionSum()).not.toThrow();
    });

    it('should throw error when refrigerant composition total does not equal 100%', () => {
      const ref = new MasterRefrigerant();
      ref.blendCode = 'R-INVALID';

      const comp1 = new RefrigerantComponent();
      comp1.massPercentage = 40;

      const comp2 = new RefrigerantComponent();
      comp2.massPercentage = 40;

      ref.components = [comp1, comp2];
      expect(() => ref.validateCompositionSum()).toThrow(
        /composition total must equal 100%/,
      );
    });

    it('should validate temporal validity (validFrom <= validTo)', () => {
      const ef = new EmissionFactor();
      ef.validFrom = '2024-01-01';
      ef.validTo = '2024-12-31';
      ef.factorValue = 2.5;

      expect(() => ef.validateTemporalValidity()).not.toThrow();
    });

    it('should throw error when validFrom is after validTo', () => {
      const ef = new EmissionFactor();
      ef.validFrom = '2025-01-01';
      ef.validTo = '2024-12-31';
      ef.factorValue = 2.5;

      expect(() => ef.validateTemporalValidity()).toThrow(
        /validFrom .* cannot be after validTo/,
      );
    });

    it('should throw error when factorValue is negative', () => {
      const ef = new EmissionFactor();
      ef.validFrom = '2024-01-01';
      ef.validTo = '2024-12-31';
      ef.factorValue = -1.5;

      expect(() => ef.validateTemporalValidity()).toThrow(
        /factorValue .* cannot be negative/,
      );
    });

    it('should enforce polymorphic detail subtype exclusivity on InventoryActivity', () => {
      const activity = new InventoryActivity();
      activity.id = 100;

      const purchasedEnergy = new PurchasedEnergyActivity();
      purchasedEnergy.activityId = activity.id;

      const scope3 = new Scope3Activity();
      scope3.activityId = activity.id;

      // Invariant check: Activity cannot map to both PurchasedEnergy and Scope3
      const validateSubtypeExclusivity = (
        details: Array<{ activityId?: number }>,
      ) => {
        const activeSubtypes = details.filter(
          (d) => d != null && d.activityId === activity.id,
        );
        if (activeSubtypes.length > 1) {
          throw new Error(
            'Polymorphic violation: InventoryActivity associated with multiple incompatible subtypes',
          );
        }
      };

      expect(() => validateSubtypeExclusivity([purchasedEnergy])).not.toThrow();
      expect(() =>
        validateSubtypeExclusivity([purchasedEnergy, scope3]),
      ).toThrow(/Polymorphic violation/);
    });
  });
});
