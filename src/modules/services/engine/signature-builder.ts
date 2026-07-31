import { RichFactorSignatureDto } from 'src/dto/calculation-result.dto';
import { FactorResolver } from './factor-resolver';

export class SignatureBuilder {
  /**
   * Constructs exact 1:1 CageSuite factor signature payload object
   */
  static buildFactorSignature(
    scopeId: string,
    activityCode: string,
    basedOption: string = 'activity',
  ): RichFactorSignatureDto {
    const codeUpper = activityCode.toUpperCase();
    const supportedSources = FactorResolver.resolveSupportedSources(codeUpper);
    const acceptedUnits = FactorResolver.resolveAcceptedUnits(codeUpper);

    return {
      statusCode: 200,
      scope: String(scopeId),
      activity: codeUpper,
      based_option: basedOption,
      available_sources: supportedSources,
      versions: ['AR6', 'AR5'],
      supported_units: acceptedUnits,
      default_formula: FactorResolver.resolveDefaultFormula(
        codeUpper,
        basedOption,
      ),
    };
  }
}
