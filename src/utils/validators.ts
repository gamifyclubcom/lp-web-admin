import { PublicKey } from '@solana/web3.js';
import Decimal from 'decimal.js';
import { round } from 'lodash';
import * as yup from 'yup';
import { getConnection } from '../shared/helper';
import { getTokenInfo } from '../utils/solana-api';

const ERROR_MESSAGE_REQUIRED = 'This is a required field.';
const ERROR_MESSAGE_DATE_TIME = 'Invalid date-time format.';
const ERROR_MESSAGE_NUMBER = 'Invalid number format.';
const ERROR_MESSAGE_POSITIVE_NUMBER = 'This field must be greater than 0';
const ERROR_MESSAGE_NOT_NEGATIVE_NUMBER =
  'This field is required greater than or equal to 0.';
const ERROR_MESSAGE_MAX_TOTAL_SUPPLY =
  'This field can not be greater than total supply';
const ERROR_MESSAGE_MAX_INDIVIDUAL_ALLOCATION =
  'This field can not be greater than total raise';
const ERROR_MESSAGE_MAX_ALLOCATION_ROUND =
  'This field can not be greater than total raise';
const ERROR_MESSAGE_VOTING_START_MIN_VALUE =
  'This time field must be later than pool start time';
const ERROR_MESSAGE_VOTING_END_MIN_VALUE =
  'This time field must be later than voting start time';
const ERROR_MESSAGE_JOIN_POOL_START_MIN_VALUE =
  'This time field must be later than voting end time';
const ERROR_MESSAGE_JOIN_POOL_END_MIN_VALUE =
  'This time field must be later than join pool start time';
const ERROR_MESSAGE_CLAIM_AT_MIN_VALUE =
  'This time field must be later than join pool end time';
const ERROR_MESSAGE_STRING_LENGTH_255 = 'It is not longer than 255 characters';
const ERROR_MESSAGE_INVALID_URL = 'This field must be a valid URL';
const ERROR_MESSAGE_LIMIT_VALUE = 'Value must be between 0 and 100';
const ERROR_MESSAGE_SPECIAL_CHARACTER =
  'This field does not contain special characters.';
const ERROR_MEESAGE_CORRECT_WEBSITE = 'Please input the correct website.';
const ERROR_MESSAGE_POOL_START_MIN_VALUE =
  'This time field must be later than now';
const ERROR_MESSAGE_EARLY_DURATION =
  'This field must be shorter than the duration between join pool start time and join pool end time.';
const ERROR_MESSAGE_FCFS_STAKE_DURATION =
  'This field must be shorter than the duration between join pool start time and join pool end time minus duration of ISOL Exclusive round.';
const ERROR_MESSAGE_INVALIDE_ADDRESS = 'Please enter the correct SOL address';
const ERROR_MESSAGE_DECIMALS =
  'The number of decimal digits does not exceed two';
const ERROR_MESSAGE_MAX_CLAIMABLE_PERCENTAGE =
  'This field can not be greater than 100';
const ERROR_MESSAGE_VOTING_PHASE_MAX_VALUE =
  'Duration of voting phase cannot be greater than max voting days setting';

export const poolValidator = yup.object().shape({
  logo: yup
    .string()
    .test('checkImageLink', 'This field must be a valid URL', (value) => {
      return new Promise(function (resolve, reject) {
        if (!value) {
          return resolve(true);
        }
        let timeout = 5000;
        const img = new Image();
        img.src = value;
        let timer: any;
        img.onerror = img.onabort = function () {
          clearTimeout(timer);
          resolve(false);
        };
        img.onload = function () {
          clearTimeout(timer);
          resolve(true);
        };
        timer = setTimeout(function () {
          // reset .src to invalid URL so it stops previous
          // loading, but doens't trigger new load
          img.src = '//!!!!/noexist.jpg';
          resolve(false);
        }, timeout);
      });
    }),
  contract_address: yup.string(),
  name: yup
    .string()
    .required(ERROR_MESSAGE_REQUIRED)
    .max(255, ERROR_MESSAGE_STRING_LENGTH_255)
    .matches(/^[^!@#$%^&*(),.?":{}|<>]+$/, ERROR_MESSAGE_SPECIAL_CHARACTER),
  tag_line: yup.string().max(255, ERROR_MESSAGE_STRING_LENGTH_255),
  website: yup
    .string()
    .url(ERROR_MESSAGE_INVALID_URL)
    .required(ERROR_MESSAGE_REQUIRED),
  audit_link: yup.string().notRequired().url(ERROR_MESSAGE_INVALID_URL),
  liquidity_percentage: yup
    .number()
    .notRequired()
    .min(0, ERROR_MESSAGE_LIMIT_VALUE)
    .max(100, ERROR_MESSAGE_LIMIT_VALUE),
  token_economic: yup.string().url(ERROR_MESSAGE_INVALID_URL),
  twitter: yup
    .string()
    .trim()
    .notRequired()
    .url(ERROR_MESSAGE_INVALID_URL)
    .test('include', ERROR_MEESAGE_CORRECT_WEBSITE, function (value) {
      if (!!value) {
        const schema = yup
          .string()
          .matches(
            /http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/,
            ERROR_MEESAGE_CORRECT_WEBSITE
          );
        return schema.isValidSync(value);
      }
      return true;
    }),

  medium: yup.string().url(ERROR_MESSAGE_INVALID_URL),

  telegram: yup
    .string()
    .trim()
    .url(ERROR_MESSAGE_INVALID_URL)
    .test('include', ERROR_MEESAGE_CORRECT_WEBSITE, function (value) {
      if (!!value) {
        const schema = yup
          .string()
          .matches(
            /(https?:\/\/)?(www[.])?((telegram|t)\.me|telegram\.org)\/([a-zA-Z0-9_-]*)\/?$/,
            ERROR_MEESAGE_CORRECT_WEBSITE
          );
        return schema.isValidSync(value);
      }
      return true;
    }),

  root_admin: yup
    .string()
    .required(ERROR_MESSAGE_REQUIRED)
    .test('checkInvaliAddress', ERROR_MESSAGE_INVALIDE_ADDRESS, (value) => {
      return new Promise(async (resolve) => {
        try {
          const acc = await getConnection().getAccountInfo(
            new PublicKey(value || '')
          );
          if (acc) {
            resolve(true);
          }
          resolve(false);
        } catch (error) {
          resolve(false);
        }
      });
    }),
  pool_start: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_POOL_START_MIN_VALUE,
      test: (value) => {
        // You can access the price field with `this.parent`.
        if (value) {
          return value.getTime() > Date.now();
        }
        return true;
      },
    }),
  join_pool_start: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_JOIN_POOL_START_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.voting_phase_is_active) {
          return value.getTime() > context.parent.voting_end.getTime();
        }
        return true;
      },
    }),
  join_pool_end: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_JOIN_POOL_END_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.join_pool_start) {
          if (context.parent.early_phase_max_total_alloc) {
            return value.getTime() > context.parent.join_pool_start.getTime();
          }
          return value.getTime() > context.parent.join_pool_start.getTime();
        }
        return true;
      },
    }),
  claim_at: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_CLAIM_AT_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.join_pool_end) {
          return value.getTime() > context.parent.join_pool_end.getTime();
        }
        return true;
      },
    }),
  description: yup.string(),
  early_phase_is_active: yup.boolean(),
  token_address: yup
    .string()
    .required(ERROR_MESSAGE_REQUIRED)
    .test(
      'checkTokenValid',
      'Please input a correct token address',
      (value) => {
        return new Promise(async (resolve) => {
          try {
            const token = await getTokenInfo(getConnection(), value || '');
            if (token) {
              resolve(true);
            }
            resolve(false);
          } catch (error) {
            resolve(false);
          }
        });
      }
    ),
  token_name: yup.string().required(ERROR_MESSAGE_REQUIRED),
  token_symbol: yup.string().required(ERROR_MESSAGE_REQUIRED),
  token_decimals: yup
    .number()
    .min(0, ERROR_MESSAGE_NOT_NEGATIVE_NUMBER)
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
  token_total_supply: yup
    .number()
    .min(0, ERROR_MESSAGE_NOT_NEGATIVE_NUMBER)
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
  token_to: yup.string().required(ERROR_MESSAGE_REQUIRED),
  public_phase_max_individual_alloc: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .max(
      yup.ref('max_allocation_all_phases'),
      ERROR_MESSAGE_MAX_INDIVIDUAL_ALLOCATION
    )
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
  is_checked_fee_information: yup
    .boolean()
    .oneOf([true], ERROR_MESSAGE_REQUIRED),
  early_phase_max_total_alloc: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('early_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .max(
            yup.ref('max_allocation_all_phases'),
            ERROR_MESSAGE_MAX_ALLOCATION_ROUND
          ),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  early_join_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('early_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_EARLY_DURATION,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value && context.parent.join_pool_end) {
                return (
                  value <=
                  (context.parent.join_pool_end.getTime() -
                    context.parent.join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  max_allocation_all_phases: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .test({
      name: 'max',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_MAX_TOTAL_SUPPLY,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          value &&
          context.parent.token_ratio &&
          context.parent.token_total_supply
        ) {
          return new Decimal(value)
            .mul(context.parent.token_ratio)
            .lessThanOrEqualTo(context.parent.token_total_supply);
        }
        return true;
      },
    })
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
  token_ratio: yup
    .number()
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER)
    .test({
      name: 'decimals',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_DECIMALS,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value) {
          return round(value, 2) === value;
        }
        return true;
      },
    }),
  claimable_percentage: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .max(100, ERROR_MESSAGE_MAX_CLAIMABLE_PERCENTAGE)
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
  fcfs_stake_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('fcfsStakersJoinIsActive', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_FCFS_STAKE_DURATION,
            test: (value, context) => {
              if (value && context.parent.early_phase_is_active) {
                if (value && context.parent.join_pool_end) {
                  return (
                    value + context.parent.early_join_duration <=
                    (context.parent.join_pool_end.getTime() -
                      context.parent.join_pool_start.getTime()) /
                      (60 * 1000)
                  );
                }
              }
              if (value && context.parent.join_pool_end) {
                return (
                  value <=
                  (context.parent.join_pool_end.getTime() -
                    context.parent.join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  fcfs_stake_phase_multiplication_rate: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('fcfsStakersJoinIsActive', {
      is: true,
      then: (sche) =>
        sche
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .max(
            yup.ref('max_allocation_all_phases'),
            ERROR_MESSAGE_MAX_INDIVIDUAL_ALLOCATION
          )
          .required(ERROR_MESSAGE_REQUIRED)
          .typeError(ERROR_MESSAGE_NUMBER),
    }),

  exclusive_phase_is_active: yup
    .boolean()
    .when('early_phase_is_active', {
      is: true,
      then: (sche) =>
        sche.required(ERROR_MESSAGE_REQUIRED).test({
          name: 'max',
          exclusive: false,
          params: {},
          message: ERROR_MESSAGE_EARLY_DURATION,
          test: (value) => {
            return !value;
          },
        }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  exclusive_phase_max_total_alloc: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('exclusive_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .max(
            yup.ref('max_allocation_all_phases'),
            ERROR_MESSAGE_MAX_ALLOCATION_ROUND
          ),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  exclusive_join_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('exclusive_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_EARLY_DURATION,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value && context.parent.join_pool_end) {
                return (
                  value <=
                  (context.parent.join_pool_end.getTime() -
                    context.parent.join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  voting_start: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_VOTING_START_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          context.parent.pool_start.voting_phase_is_active &&
          value &&
          context.parent.pool_start
        ) {
          return value.getTime() > context.parent.pool_start.getTime();
        }
        return true;
      },
    }),
  voting_end: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_VOTING_END_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          context.parent.pool_start.voting_phase_is_active &&
          value &&
          context.parent.voting_start
        ) {
          return value.getTime() > context.parent.voting_start.getTime();
        }
        return true;
      },
    })
    .test({
      name: 'max_duration',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_VOTING_PHASE_MAX_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          context.parent.pool_start.voting_phase_is_active &&
          value &&
          context.parent.max_voting_days
        ) {
          return (
            value.getTime() - context.parent.voting_start.getTime() <
            context.parent.max_voting_days * 3600 * 1000 * 24
          );
        }
        return true;
      },
    }),
});

export const adminValidator = yup.object().shape({
  logo: yup.string(),
  address: yup.string().required(),
  first_name: yup.string(),
  last_name: yup.string(),
  email: yup.string().email(),
});

export const poolOffchainValidator = yup.object().shape({
  logo: yup
    .string()
    .test('checkImageLink', 'This field must be a valid URL', (value) => {
      return new Promise(function (resolve, reject) {
        if (!value) {
          return resolve(true);
        }
        let timeout = 5000;
        const img = new Image();
        img.src = value;
        let timer: any;
        img.onerror = img.onabort = function () {
          clearTimeout(timer);
          resolve(false);
        };
        img.onload = function () {
          clearTimeout(timer);
          resolve(true);
        };
        timer = setTimeout(function () {
          // reset .src to invalid URL so it stops previous
          // loading, but doens't trigger new load
          img.src = '//!!!!/noexist.jpg';
          resolve(false);
        }, timeout);
      });
    }),
  contract_address: yup.string(),
  name: yup
    .string()
    .required(ERROR_MESSAGE_REQUIRED)
    .max(255, ERROR_MESSAGE_STRING_LENGTH_255)
    .matches(/^[^!@#$%^&*(),.?":{}|<>]+$/, ERROR_MESSAGE_SPECIAL_CHARACTER),
  tag_line: yup.string().max(255, ERROR_MESSAGE_STRING_LENGTH_255),
  website: yup
    .string()
    .url(ERROR_MESSAGE_INVALID_URL)
    .required(ERROR_MESSAGE_REQUIRED),
  audit_link: yup.string().notRequired().url(ERROR_MESSAGE_INVALID_URL),
  liquidity_percentage: yup
    .number()
    .notRequired()
    .min(0, ERROR_MESSAGE_LIMIT_VALUE)
    .max(100, ERROR_MESSAGE_LIMIT_VALUE),
  token_economic: yup.string().url(ERROR_MESSAGE_INVALID_URL),
  twitter: yup
    .string()
    .trim()
    .notRequired()
    .url(ERROR_MESSAGE_INVALID_URL)
    .test('include', ERROR_MEESAGE_CORRECT_WEBSITE, function (value) {
      if (!!value) {
        const schema = yup
          .string()
          .matches(
            /http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/,
            ERROR_MEESAGE_CORRECT_WEBSITE
          );
        return schema.isValidSync(value);
      }
      return true;
    }),

  medium: yup.string().url(ERROR_MESSAGE_INVALID_URL),

  telegram: yup
    .string()
    .trim()
    .url(ERROR_MESSAGE_INVALID_URL)
    .test('include', ERROR_MEESAGE_CORRECT_WEBSITE, function (value) {
      if (!!value) {
        const schema = yup
          .string()
          .matches(
            /(https?:\/\/)?(www[.])?((telegram|t)\.me|telegram\.org)\/([a-zA-Z0-9_-]*)\/?$/,
            ERROR_MEESAGE_CORRECT_WEBSITE
          );
        return schema.isValidSync(value);
      }
      return true;
    }),

  pool_start: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: 'This time field must be later than join pool start',
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (context.parent.is_active) {
          return true;
        }
        if (value) {
          return value.getTime() <= context.parent.join_pool_start.getTime();
        }
        return true;
      },
    }),
  description: yup.string(),
  join_pool_start: yup.date(),
  token_name: yup.string().required(ERROR_MESSAGE_REQUIRED),
  token_symbol: yup.string().required(ERROR_MESSAGE_REQUIRED),
  claimable_percentage: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .max(100, ERROR_MESSAGE_MAX_CLAIMABLE_PERCENTAGE)
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
});

export const poolOnchainValidator = yup.object().shape({
  pool_start: yup.date(),
  join_pool_start: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_JOIN_POOL_START_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.pool_start) {
          return value.getTime() > context.parent.pool_start.getTime();
        }
        return true;
      },
    }),
  early_join_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('early_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_EARLY_DURATION,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value && context.parent.join_pool_end) {
                return (
                  value <=
                  (context.parent.join_pool_end.getTime() -
                    context.parent.join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  join_pool_end: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_JOIN_POOL_END_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.join_pool_start) {
          if (context.parent.early_phase_max_total_alloc) {
            return value.getTime() > context.parent.join_pool_start.getTime();
          }
          return value.getTime() > context.parent.join_pool_start.getTime();
        }
        return true;
      },
    }),
  claim_at: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_CLAIM_AT_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.join_pool_end) {
          return value.getTime() > context.parent.join_pool_end.getTime();
        }
        return true;
      },
    }),
  early_phase_is_active: yup.boolean(),
  public_phase_max_individual_alloc: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .max(
      yup.ref('max_allocation_all_phases'),
      ERROR_MESSAGE_MAX_INDIVIDUAL_ALLOCATION
    )
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
  early_phase_max_total_alloc: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('early_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .max(
            yup.ref('max_allocation_all_phases'),
            ERROR_MESSAGE_MAX_ALLOCATION_ROUND
          ),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  max_allocation_all_phases: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .test({
      name: 'max',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_MAX_TOTAL_SUPPLY,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          value &&
          context.parent.token_ratio &&
          context.parent.token_total_supply
        ) {
          return new Decimal(value)
            .mul(context.parent.token_ratio)
            .lessThanOrEqualTo(context.parent.token_total_supply);
        }
        return true;
      },
    })
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER),
  token_ratio: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_NUMBER)
    .test({
      name: 'decimals',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_DECIMALS,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value) {
          return round(value, 2) === value;
        }
        return true;
      },
    }),
  fcfs_stake_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('fcfsStakersJoinIsActive', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_FCFS_STAKE_DURATION,
            test: (value, context) => {
              if (value && context.parent.early_phase_is_active) {
                if (value && context.parent.join_pool_end) {
                  return (
                    value + context.parent.early_join_duration ||
                    0 <=
                      (context.parent.join_pool_end.getTime() -
                        context.parent.join_pool_start.getTime()) /
                        (60 * 1000)
                  );
                }
              }
              if (value && context.parent.join_pool_end) {
                return (
                  value <=
                  (context.parent.join_pool_end.getTime() -
                    context.parent.join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  fcfs_stake_phase_multiplication_rate: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('fcfsStakersJoinIsActive', {
      is: true,
      then: (sche) =>
        sche
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .max(
            yup.ref('max_allocation_all_phases'),
            ERROR_MESSAGE_MAX_INDIVIDUAL_ALLOCATION
          )
          .required(ERROR_MESSAGE_REQUIRED)
          .typeError(ERROR_MESSAGE_NUMBER),
    }),
  exclusive_phase_is_active: yup
    .boolean()
    .when('early_phase_is_active', {
      is: true,
      then: (sche) =>
        sche.required(ERROR_MESSAGE_REQUIRED).test({
          name: 'max',
          exclusive: false,
          params: {},
          message: ERROR_MESSAGE_EARLY_DURATION,
          test: (value) => {
            return !value;
          },
        }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  exclusive_phase_max_total_alloc: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('exclusive_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .max(
            yup.ref('max_allocation_all_phases'),
            ERROR_MESSAGE_MAX_ALLOCATION_ROUND
          ),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  exclusive_join_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('exclusive_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_EARLY_DURATION,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value && context.parent.join_pool_end) {
                return (
                  value <=
                  (context.parent.join_pool_end.getTime() -
                    context.parent.join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  voting_start: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_VOTING_START_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          context.parent.pool_start.voting_phase_is_active &&
          value &&
          context.parent.pool_start
        ) {
          return value.getTime() > context.parent.pool_start.getTime();
        }
        return true;
      },
    }),
  voting_end: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_VOTING_END_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          context.parent.pool_start.voting_phase_is_active &&
          value &&
          context.parent.voting_start
        ) {
          return value.getTime() > context.parent.voting_start.getTime();
        }
        return true;
      },
    })
    .test({
      name: 'max_duration',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_VOTING_PHASE_MAX_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (
          context.parent.pool_start.voting_phase_is_active &&
          value &&
          context.parent.max_voting_days
        ) {
          return (
            value.getTime() - context.parent.voting_start.getTime() <
            context.parent.max_voting_days * 24 * 3600 * 1000
          );
        }
        return true;
      },
    }),
});

export const poolChangeAdminValidator = yup.object().shape({
  root_admin: yup
    .string()
    .required(ERROR_MESSAGE_REQUIRED)
    .test('checkInvaliAddress', ERROR_MESSAGE_INVALIDE_ADDRESS, (value) => {
      return new Promise(async (resolve) => {
        try {
          const acc = await getConnection().getAccountInfo(
            new PublicKey(value || '')
          );
          if (acc) {
            resolve(true);
          }
          resolve(false);
        } catch (error) {
          resolve(false);
        }
      });
    }),
});

const ERROR_UPDATE_MILESTONE_HAPPENDED =
  'Cannot update milestone that has happened';
const ERROR_UPDATE_PAST_TIME = `This field cannot be updated before the current time`;
const ERROR_UPDATE_WHITELIST_DURATION_HAPPENDED =
  'Cannot update this field because whitelist round has happened';
const ERROR_UPDATE_DURATION_HAPPENDED =
  'Cannot update this field because exclusive round has happened';
const ERROR_UPDATE_EXCLUSIVE_DURATION_PAST_TIME = `Cannot update this field because the end time of exclusive round will be in past`;
const ERROR_UPDATE_EARLY_DURATION_PAST_TIME = `Cannot update this field because the end time of whitelist round will be in past`;

const ERROR_UPDATE_FCFS_STAKE_DURATION_HAPPENDED =
  'Cannot update this field because fcfs stake round has happened';
const ERROR_UPDATE_FCFS_STAKE_DURATION_PAST_TIME = `Cannot update this field because the end time of fcfs round will be in past`;

export const poolSettimeValidator = yup.object().shape({
  new_join_pool_start: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'is_able_updated',
      exclusive: false,
      params: {},
      message: ERROR_UPDATE_MILESTONE_HAPPENDED,
      test: (value, context) => {
        if (value) {
          return (
            value.getTime() ===
              new Date(context.parent.join_pool_start).getTime() ||
            new Date(context.parent.join_pool_start).getTime() > Date.now()
          );
        }
        return true;
      },
    })
    .test({
      name: 'is_past',
      exclusive: false,
      params: {},
      message: ERROR_UPDATE_PAST_TIME,
      test: (value, context) => {
        if (value) {
          return (
            value.getTime() ===
              new Date(context.parent.join_pool_start).getTime() ||
            value.getTime() > Date.now()
          );
        }
        return true;
      },
    }),
  new_join_pool_end: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_JOIN_POOL_END_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.new_join_pool_start) {
          return (
            value.getTime() >
            new Date(context.parent.new_join_pool_start).getTime()
          );
        }
        return true;
      },
    })
    .test({
      name: 'is_able_updated',
      exclusive: false,
      params: {},
      message: ERROR_UPDATE_MILESTONE_HAPPENDED,
      test: (value, context) => {
        if (value) {
          return (
            value.getTime() ===
              new Date(context.parent.join_pool_end).getTime() ||
            new Date(context.parent.join_pool_end).getTime() > Date.now()
          );
        }
        return true;
      },
    })
    .test({
      name: 'is_past',
      exclusive: false,
      params: {},
      message: ERROR_UPDATE_PAST_TIME,
      test: (value, context) => {
        if (value) {
          return (
            value.getTime() ===
              new Date(context.parent.join_pool_end).getTime() ||
            value.getTime() > Date.now()
          );
        }
        return true;
      },
    }),
  new_claim_at: yup
    .date()
    .required(ERROR_MESSAGE_REQUIRED)
    .typeError(ERROR_MESSAGE_DATE_TIME)
    .test({
      name: 'min',
      exclusive: false,
      params: {},
      message: ERROR_MESSAGE_CLAIM_AT_MIN_VALUE,
      test: (value, context) => {
        // You can access the price field with `this.parent`.
        if (value && context.parent.new_join_pool_end) {
          return (
            value.getTime() >
            new Date(context.parent.new_join_pool_end).getTime()
          );
        }
        return true;
      },
    })
    .test({
      name: 'is_able_updated',
      exclusive: false,
      params: {},
      message: ERROR_UPDATE_MILESTONE_HAPPENDED,
      test: (value, context) => {
        if (value) {
          return (
            value.getTime() === new Date(context.parent.claim_at).getTime() ||
            new Date(context.parent.claim_at).getTime() > Date.now()
          );
        }
        return true;
      },
    })
    .test({
      name: 'is_past',
      exclusive: false,
      params: {},
      message: ERROR_UPDATE_PAST_TIME,
      test: (value, context) => {
        if (value) {
          return (
            value.getTime() === new Date(context.parent.claim_at).getTime() ||
            value.getTime() > Date.now()
          );
        }
        return true;
      },
    }),
  new_early_join_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('early_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'is_able_updated',
            exclusive: false,
            params: {},
            message: ERROR_UPDATE_WHITELIST_DURATION_HAPPENDED,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value) {
                return (
                  value === +context.parent.early_join_duration ||
                  new Date(context.parent.join_pool_start).getTime() +
                    +context.parent.early_join_duration * 60 * 1000 >
                    Date.now()
                );
              }

              return true;
            },
          })
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_EARLY_DURATION,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value) {
                return (
                  value <=
                  (context.parent.new_join_pool_end.getTime() -
                    context.parent.new_join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          })
          .test({
            name: 'is_past',
            exclusive: false,
            params: {},
            message: ERROR_UPDATE_EARLY_DURATION_PAST_TIME,
            test: (value, context) => {
              if (value) {
                return (
                  value === context.parent.early_join_duration ||
                  context.parent.new_join_pool_start.getTime() +
                    context.parent.new_early_join_duration * 60 * 1000 >
                    Date.now()
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  new_fcfs_stake_join_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('fcfs_stake_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'is_able_updated',
            exclusive: false,
            params: {},
            message: ERROR_UPDATE_FCFS_STAKE_DURATION_HAPPENDED,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value) {
                if (context.parent.early_phase_is_active) {
                  return (
                    value === +context.parent.new_fcfs_stake_join_duration ||
                    new Date(context.parent.join_pool_start).getTime() +
                      +context.parent.fcfs_stake_join_duration * 60 * 1000 +
                      +context.parent.early_join_duration * 60 * 1000 >
                      Date.now()
                  );
                } else {
                  return (
                    value === +context.parent.new_fcfs_stake_join_duration ||
                    new Date(context.parent.join_pool_start).getTime() +
                      +context.parent.early_join_duration * 60 * 1000 >
                      Date.now()
                  );
                }
              }

              return true;
            },
          })
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_FCFS_STAKE_DURATION,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value && context.parent.early_phase_is_active) {
                if (value && context.parent.new_join_pool_end) {
                  return (
                    value + context.parent.new_early_join_duration <=
                    (context.parent.new_join_pool_end.getTime() -
                      context.parent.new_join_pool_start.getTime()) /
                      (60 * 1000)
                  );
                }
              }
              if (value && context.parent.new_join_pool_end) {
                return (
                  value <=
                  (context.parent.new_join_pool_end.getTime() -
                    context.parent.new_join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          })
          .test({
            name: 'is_past',
            exclusive: false,
            params: {},
            message: ERROR_UPDATE_FCFS_STAKE_DURATION_PAST_TIME,
            test: (value, context) => {
              if (value) {
                if (context.parent.early_phase_is_active) {
                  return (
                    value === context.parent.fcfs_stake_join_duration ||
                    context.parent.new_join_pool_start.getTime() +
                      context.parent.new_early_join_duration * 60 * 1000 +
                      context.parent.new_fcfs_stake_join_duration * 60 * 1000 >
                      Date.now()
                  );
                } else {
                  return (
                    value === context.parent.fcfs_stake_join_duration ||
                    context.parent.new_join_pool_start.getTime() +
                      context.parent.new_fcfs_stake_join_duration * 60 * 1000 >
                      Date.now()
                  );
                }
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
  new_exclusive_join_duration: yup
    .number()
    .transform((cv, ov) => {
      return ov === '' ? undefined : cv;
    })
    .when('exclusive_phase_is_active', {
      is: true,
      then: (sche) =>
        sche
          .required(ERROR_MESSAGE_REQUIRED)
          .positive(ERROR_MESSAGE_POSITIVE_NUMBER)
          .test({
            name: 'is_able_updated',
            exclusive: false,
            params: {},
            message: ERROR_UPDATE_DURATION_HAPPENDED,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value) {
                return (
                  value === +context.parent.exclusive_join_duration ||
                  new Date(context.parent.join_pool_start).getTime() +
                    +context.parent.exclusive_join_duration * 60 * 1000 >
                    Date.now()
                );
              }

              return true;
            },
          })
          .test({
            name: 'max',
            exclusive: false,
            params: {},
            message: ERROR_MESSAGE_EARLY_DURATION,
            test: (value, context) => {
              // You can access the price field with `this.parent`.
              if (value) {
                return (
                  value <=
                  (context.parent.new_join_pool_end.getTime() -
                    context.parent.new_join_pool_start.getTime()) /
                    (60 * 1000)
                );
              }
              return true;
            },
          })
          .test({
            name: 'is_past',
            exclusive: false,
            params: {},
            message: ERROR_UPDATE_EXCLUSIVE_DURATION_PAST_TIME,
            test: (value, context) => {
              if (value) {
                return (
                  value === +context.parent.exclusive_join_duration ||
                  context.parent.new_join_pool_start.getTime() +
                    context.parent.new_exclusive_join_duration * 60 * 1000 >
                    Date.now()
                );
              }
              return true;
            },
          }),
    })
    .typeError(ERROR_MESSAGE_NUMBER),
});
