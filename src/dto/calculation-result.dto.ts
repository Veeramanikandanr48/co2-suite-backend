export interface GasBreakdownDto {
  SF6: number;
  total: number;
  HFC: number;
  CO2: number;
  N2O: number;
  NF3: number;
  PFC: number;
  CH4: number;
}

export interface InputEfDto {
  SF6: string;
  total: string;
  HFC: string;
  CO2: string;
  N2O: string;
  NF3: string;
  PFC: string;
  CH4: string;
}

export interface ActivityResultDto {
  based_option: string;
  input_ef: InputEfDto;
  comment: string;
  PK: string;
  facility_name: string;
  facility_uuid: string;
  from_date: string;
  source: string;
  to_date: string;
  input: string;
  status: string;
  SK: string;
  unit: string;
  name: string;
  creation_date: string;
  isDefault: boolean;
  activity: string;
  emissions: GasBreakdownDto;
  version: string;
  amount: string;
  scope: string;
}

export interface RichFactorSignatureDto {
  statusCode: number;
  scope: string;
  activity: string;
  based_option: string;
  available_sources: string[];
  versions: string[];
  supported_units: string[];
  default_formula: string;
}
