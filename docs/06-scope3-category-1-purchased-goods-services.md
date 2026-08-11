# Category 1 — Purchased Goods & Services

## 1. Purpose

Category 1 captures purchased goods and purchased services represented in the organization's value chain.

The collection workbook separates:
- `S3 - Purchased Goods`
- `S3 - Services`

## 2. Purchased goods fields

The workbook provides:
- Month
- Supplier name
- Goods category
- Description
- Land transport fields
- Sea transport fields
- Air transport fields

For each transport mode it provides:
- Vehicle type
- Number of trips
- Origin
- Destination
- Distance per trip
- Weight

This means the application must not model purchased goods as only a spend amount.

## 3. Goods classification

The workbook contains a long goods-category list in `Sheet1`, including material/process descriptions such as aluminium and other basic metals.

Recommended master structure:

```text
Goods Category
 ├── category code
 ├── category name
 ├── material
 ├── process
 ├── factor family
 ├── factor unit
 └── active
```

## 4. Services

The service form contains:
- month,
- services category,
- description,
- cost.

The application should support spend-based factors where the selected methodology uses financial data.

## 5. Calculation methods

Possible methods:

### Supplier-specific
```text
Supplier activity × supplier-specific factor
```

### Physical/activity based
```text
Quantity × product/material factor
```

### Transport component
```text
Weight × distance × transport factor
```

### Spend based
```text
Spend × spend emission factor
```

The selected method must be stored with the result.

## 6. Validation

- supplier required,
- category required,
- quantity/weight required for physical method,
- cost required for spend method,
- origin/destination required for transport method,
- distance > 0 when distance-based,
- weight > 0 when mass-distance based.

## 7. Evidence

Examples supported by the source fields:
- supplier invoice,
- purchase order,
- logistics record,
- supplier emission information,
- accounting record.

## 8. Correct Calculation Method Set

GHG Protocol Scope 3 guidance provides multiple methods for Category 1, including the hybrid method. The application shall support at least:

1. Supplier-specific method.
2. Hybrid method.
3. Average-data method.
4. Spend-based method.
5. Other approved activity/physical-data approaches where the selected guidance permits them.

### 8.1 Hybrid method

The current Scope 3 Calculation Guidance describes the hybrid method as combining supplier-specific activity/emissions information with secondary data to fill gaps. It is not simply a synonym for mixing spend-based and average-data calculations.

For implementation, support the following separately:
1. Supplier-specific method.
2. Hybrid method — supplier data/allocated supplier emissions plus supplier activity data and secondary data where supplier-specific information is unavailable.
3. Average-data / physical-data method.
4. Average spend-based / EEIO method.

A calculation record must store the selected method and each component used. A mixture of material-based and spend-based methods may be supported where permitted, but it must not be labeled `HYBRID` unless it follows the hybrid-method definition.

### 8.2 Transport boundary

Transport fields appearing on a purchased-goods form do not automatically make the transport emissions part of Category 1. The application shall classify the transport according to the applicable Scope 3 boundary. Where the transport is an upstream transportation and distribution activity, it should be routed to Category 4 unless the selected methodology explicitly includes it in another calculation.

### 8.3 Spend-based factors

Spend factors must specify currency, price-year basis and economic/geographic scope. Nominal spend must not be multiplied by a factor from another currency/year without an explicit normalization step.

