import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  PropsWithChildren,
  useMemo,
} from 'react';
import { css } from '@emotion/react';
import { faker } from '@faker-js/faker';

import {
  EuiDataGrid,
  EuiDataGridProps,
  EuiDataGridCustomBodyProps,
  EuiDataGridColumnCellActionProps,
  EuiScreenReaderOnly,
  EuiCheckbox,
  EuiButtonIcon,
  EuiIcon,
  EuiFlexGroup,
  EuiSwitch,
  EuiSpacer,
  useEuiTheme,
  logicalCSS,
  EuiDataGridPaginationProps,
  EuiDataGridSorting,
  EuiDataGridColumnSortingConfig,
  RenderCellValue,
  EuiAutoSizer,
} from '../../../../../src';
import { VariableSizeList } from 'react-window';

type CustomTimelineDataGridSingleRowProps = {
  rowIndex: number;
  setRowHeight: (index: number, height: number) => void;
  maxWidth: number | undefined;
  showRowDetails: boolean;
} & Pick<EuiDataGridCustomBodyProps, 'visibleColumns' | 'Cell'>;

const Row = ({
  rowIndex,
  visibleColumns,
  setRowHeight,
  Cell,
  showRowDetails,
}: CustomTimelineDataGridSingleRowProps) => {
  const { euiTheme } = useEuiTheme();
  const styles = {
    row: css`
      ${logicalCSS('width', 'fit-content')};
      ${logicalCSS('border-bottom', euiTheme.border.thin)};
      background-color: ${euiTheme.colors.emptyShade};
    `,
    rowCellsWrapper: css`
      display: flex;
    `,
    rowDetailsWrapper: css`
      text-align: center;
      background-color: ${euiTheme.colors.body};
    `,
  };
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rowRef.current) {
      setRowHeight(rowIndex, rowRef.current.offsetHeight);
    }
  }, [Cell, rowIndex, setRowHeight]);

  return (
    <div ref={rowRef} role="row" css={styles.row} key={rowIndex}>
      <div css={styles.rowCellsWrapper}>
        {visibleColumns.map((column, colIndex) => {
          // Skip the row details cell - we'll render it manually outside of the flex wrapper
          if (column.id !== 'row-details') {
            return (
              <Cell
                colIndex={colIndex}
                visibleRowIndex={rowIndex}
                key={`${rowIndex},${colIndex}`}
              />
            );
          }
        })}
      </div>
      {showRowDetails && (
        <div css={styles.rowDetailsWrapper}>
          <Cell
            rowHeightsOptions={{
              defaultHeight: 'auto',
            }}
            colIndex={visibleColumns.length - 1} // If the row is being shown, it should always be the last index
            visibleRowIndex={rowIndex}
          />
        </div>
      )}
    </div>
  );
};

const raw_data: Array<{ [key: string]: string }> = [];
for (let i = 1; i < 100; i++) {
  raw_data.push({
    name: `${faker.person.lastName()}, ${faker.person.firstName()}`,
    email: faker.internet.email(),
    location: `${faker.location.city()}, ${faker.location.country()}`,
    date: `${faker.date.past()}`,
    amount: faker.commerce.price({ min: 1, max: 1000, dec: 2, symbol: '$' }),
  });
}

const columns = [
  {
    id: 'name',
    displayAsText: 'Name',
    cellActions: [
      ({ Component }: EuiDataGridColumnCellActionProps) => (
        <Component
          onClick={() => alert('action')}
          iconType="faceHappy"
          aria-label="Some action"
        >
          Some action
        </Component>
      ),
    ],
  },
  {
    id: 'email',
    displayAsText: 'Email address',
    initialWidth: 130,
  },
  {
    id: 'location',
    displayAsText: 'Location',
  },
  {
    id: 'date',
    displayAsText: 'Date',
  },
  {
    id: 'amount',
    displayAsText: 'Amount',
  },
];

const checkboxRowCellRender: RenderCellValue = ({ rowIndex }) => (
  <EuiCheckbox
    id={`select-row-${rowIndex}`}
    aria-label="Select row"
    onChange={() => {}}
  />
);

const leadingControlColumns: EuiDataGridProps['leadingControlColumns'] = [
  {
    id: 'selection',
    width: 32,
    headerCellRender: () => (
      <EuiCheckbox
        id="select-all-rows"
        aria-label="Select all rows"
        onChange={() => {}}
      />
    ),
    rowCellRender: checkboxRowCellRender,
  },
];

const trailingControlColumns: EuiDataGridProps['trailingControlColumns'] = [
  {
    id: 'actions',
    width: 40,
    headerCellRender: () => (
      <EuiScreenReaderOnly>
        <span>Actions</span>
      </EuiScreenReaderOnly>
    ),
    rowCellRender: () => (
      <EuiButtonIcon iconType="boxesHorizontal" aria-label="See row actions" />
    ),
  },
];

const RowCellRender: RenderCellValue = ({ setCellProps, rowIndex }) => {
  setCellProps({ style: { width: '100%', height: 'auto' } });

  const firstName = raw_data[rowIndex].name.split(', ')[1];
  const isGood = faker.datatype.boolean();
  const randomeSentence = faker.lorem.paragraph({ min: 1, max: 10 });
  return (
    <div style={{ textAlign: 'left' }}>
      <p>
        {firstName}&apos;s account has {isGood ? 'no' : ''} outstanding fees.{' '}
        <EuiIcon
          type={isGood ? 'checkInCircleFilled' : 'error'}
          color={isGood ? 'success' : 'danger'}
        />
      </p>
      <div>
        <p>{randomeSentence}</p>
      </div>
    </div>
  );
};

// The custom row details is actually a trailing control column cell with
// a hidden header. This is important for accessibility and markup reasons
// @see https://fuschia-stretch.glitch.me/ for more
const rowDetails: EuiDataGridProps['trailingControlColumns'] = [
  {
    id: 'row-details',

    // The header cell should be visually hidden, but available to screen readers
    width: 0,
    headerCellRender: () => <>Row details</>,
    headerCellProps: { className: 'euiScreenReaderOnly' },

    // The footer cell can be hidden to both visual & SR users, as it does not contain meaningful information
    footerCellProps: { style: { display: 'none' } },

    // When rendering this custom cell, we'll want to override
    // the automatic width/heights calculated by EuiDataGrid
    rowCellRender: RowCellRender,
  },
];

const footerCellValues: { [key: string]: string } = {
  amount: `Total: ${raw_data
    .reduce((acc, { amount }) => acc + Number(amount.split('$')[1]), 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
};

const renderCellValue: RenderCellValue = ({ rowIndex, columnId }) =>
  raw_data[rowIndex][columnId];

const RenderFooterCellValue: RenderCellValue = ({ columnId, setCellProps }) => {
  const value = footerCellValues[columnId];

  useEffect(() => {
    // Turn off the cell expansion button if the footer cell is empty
    if (!value) setCellProps({ isExpandable: false });
  }, [value, setCellProps, columnId]);

  return value || null;
};

export default () => {
  const [autoHeight, setAutoHeight] = useState(false);
  const [showRowDetails, setShowRowDetails] = useState(true);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.map(({ id }) => id)
  );

  // Pagination
  const [pagination, setPagination] = useState({ pageIndex: 0 });
  const onChangePage = useCallback<EuiDataGridPaginationProps['onChangePage']>(
    (pageIndex) => {
      setPagination((pagination) => ({ ...pagination, pageIndex }));
    },
    []
  );
  const onChangePageSize = useCallback<
    EuiDataGridPaginationProps['onChangeItemsPerPage']
  >((pageSize) => {
    setPagination((pagination) => ({ ...pagination, pageSize }));
  }, []);

  // Sorting
  const [sortingColumns, setSortingColumns] = useState<
    EuiDataGridColumnSortingConfig[]
  >([]);
  const onSort = useCallback<EuiDataGridSorting['onSort']>((sortingColumns) => {
    setSortingColumns(sortingColumns);
  }, []);

  // Custom grid body renderer
  const RenderCustomGridBody = useCallback(
    ({
      Cell,
      visibleColumns,
      visibleRowData,
      setCustomGridBodyProps,
      headerRow,
      footerRow,
    }: EuiDataGridCustomBodyProps) => {
      // Ensure we're displaying correctly-paginated rows
      const visibleRows = raw_data.slice(
        visibleRowData.startRow,
        visibleRowData.endRow
      );

      // Add styling needed for custom grid body rows

      // Set custom props onto the grid body wrapper
      const bodyRef = useRef<HTMLDivElement | null>(null);
      useEffect(() => {
        setCustomGridBodyProps({
          ref: bodyRef,
          onScroll: () =>
            console.debug('scrollTop:', bodyRef.current?.scrollTop),
        });
      }, [setCustomGridBodyProps]);

      const listRef = useRef<VariableSizeList<unknown>>(null);
      const rowHeights = useRef<number[]>([]);

      const setRowHeight = useCallback((index: number, height: number) => {
        if (rowHeights.current[index] === height) return;
        listRef.current?.resetAfterIndex(index);

        rowHeights.current[index] = height;
      }, []);

      const getRowHeight = useCallback((index: number) => {
        return rowHeights.current[index] ?? 100;
      }, []);

      const outer = useMemo(
        () =>
          React.forwardRef<HTMLDivElement, PropsWithChildren<{}>>(
            ({ children, ...rest }, ref) => {
              return (
                <div ref={ref} {...rest}>
                  {headerRow}
                  {children}
                  {footerRow}
                </div>
              );
            }
          ),
        [headerRow, footerRow]
      );

      const inner = useMemo(
        () =>
          React.forwardRef<HTMLDivElement, PropsWithChildren<{}>>(
            ({ children, style, ...rest }, ref) => {
              return (
                <div
                  className="row-container"
                  ref={ref}
                  style={{ ...style, position: 'relative' }}
                  {...rest}
                >
                  {children}
                </div>
              );
            }
          ),
        []
      );

      return (
        <EuiAutoSizer disableWidth>
          {({ height }) => {
            console.log(`new height is ${height}`);
            return (
              <VariableSizeList
                ref={listRef}
                // Full re-render when height changes to ensure correct row positioning
                key={height}
                height={height}
                width="100%"
                itemCount={visibleRows.length}
                itemSize={getRowHeight}
                outerElementType={outer}
                innerElementType={inner}
                overscanCount={0}
              >
                {({ index: rowIndex, style }) => {
                  return (
                    <div
                      className={`row-${rowIndex}`}
                      style={{
                        ...style,
                      }}
                      key={`${height}-${rowIndex}`}
                    >
                      <Row
                        showRowDetails={showRowDetails}
                        rowIndex={rowIndex}
                        setRowHeight={setRowHeight}
                        visibleColumns={visibleColumns}
                        Cell={Cell}
                        maxWidth={100}
                      />
                    </div>
                  );
                }}
              </VariableSizeList>
            );
          }}
        </EuiAutoSizer>
      );
    },
    [showRowDetails]
  );

  return (
    <>
      <EuiFlexGroup alignItems="center">
        <EuiSwitch
          label="Set static grid height"
          checked={!autoHeight}
          onChange={() => setAutoHeight(!autoHeight)}
        />
        <EuiSwitch
          label="Toggle custom row details"
          checked={showRowDetails}
          onChange={() => setShowRowDetails(!showRowDetails)}
        />
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiDataGrid
        aria-label="Data grid custom body renderer demo"
        columns={columns}
        leadingControlColumns={leadingControlColumns}
        trailingControlColumns={
          showRowDetails
            ? [...trailingControlColumns, ...rowDetails]
            : trailingControlColumns
        }
        columnVisibility={{ visibleColumns, setVisibleColumns }}
        sorting={{ columns: sortingColumns, onSort }}
        inMemory={{ level: 'sorting' }}
        pagination={{
          ...pagination,
          onChangePage: onChangePage,
          onChangeItemsPerPage: onChangePageSize,
        }}
        rowCount={raw_data.length}
        renderCellValue={renderCellValue}
        renderFooterCellValue={RenderFooterCellValue}
        renderCustomGridBody={RenderCustomGridBody}
        height={400}
        gridStyle={{ border: 'none', header: 'underline' }}
      />
    </>
  );
};
