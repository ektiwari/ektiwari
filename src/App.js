import React, { useEffect,useState } from 'react'
import styled from 'styled-components'
import { useTable, useGroupBy, useExpanded, useSortBy } from 'react-table'

import mockData from './mockData'

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`

function Table({ columns, data }) {
  const sortees = React.useMemo(
    () => [
      {
        id: "price",
        desc: true
      }
    ],
    []
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    setGroupBy,
    prepareRow,
    state: { groupBy, expanded },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: sortees,
      }
    },
    useGroupBy,
    useSortBy,
    useExpanded // useGroupBy would be pretty useless without useExpanded ;)
  )

  // We don't want to render all of the rows for this example, so cap
  // it at 100 for this use case
  const firstPageRows = rows.slice(0, 100);

  const getLeafColumns = function (rootColumns) {
    return rootColumns.reduce((leafColumns, column)=>{
        if (column.columns) {
            return [...leafColumns, ...getLeafColumns(column.columns)];
        } else {
            return [...leafColumns, column];
        }
    }, []);
  }

  useEffect(()=>{
    setGroupBy(['category']);
  },[])

  return (
    <>
      {/* <pre>
        <code>{JSON.stringify({ groupBy, expanded }, null, 2)}</code>
      </pre>
      Group By:
      <select
        value={'category'}
        onChange={e => {
          setGroupBy([e.target.value]);
        }}
      >
        <option value="">None</option>
        {getLeafColumns(columns).map(column => (
          <option key={column.accessor} value={column.accessor}>{column.Header}</option>
        ))}
      </select> */}
      
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>
                  {/* {column.canGroupBy ? (
                    // If the column can be grouped, let's add a toggle
                    <span {...column.getGroupByToggleProps()}>
                      {column.isGrouped ? '🛑 ' : '👊 '}
                    </span>
                  ) : null} */}
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {firstPageRows.map((row, i) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return (
                    <td
                      // For educational purposes, let's color the
                      // cell depending on what type it is given
                      // from the useGroupBy hook
                      {...cell.getCellProps()}
                      style={{
                        background: cell.isGrouped
                          ? '#0aff0082'
                          : cell.isAggregated
                          ? '#ffa50078'
                          : cell.isPlaceholder
                          ? '#ff000042'
                          : 'white',
                      }}
                    >
                      {cell.isGrouped ? (
                        // If it's a grouped cell, add an expander and row count
                        <>
                          <span {...row.getToggleRowExpandedProps()}>
                            {row.isExpanded ? '👇' : '👉'}
                          </span>{' '}
                          {cell.render('Cell')} ({row.subRows.length})
                        </>
                      ) : cell.isAggregated ? (
                        // If the cell is aggregated, use the Aggregated
                        // renderer for cell
                        cell.render('Aggregated')
                      ) : cell.isPlaceholder ? null : ( // For cells with repeated values, render null
                        // Otherwise, just render the regular cell
                        cell.render('Cell')
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <br />
      <div>Showing the first {rows.length} results of {rows.length} rows</div>
    </>
  )
}


function App() {

  const saveSession = ()=>{
    sessionStorage.setItem('userData', JSON.stringify(data));
  }

  const resetSession = ()=>{
    sessionStorage.setItem('userData', JSON.stringify(mockData(9)));
    setData(getSession());

  }

  const getSession = () => {
    let kdata = sessionStorage.getItem('userData');
    if(kdata == null )
      return null;
    return JSON.parse(kdata);
  }

  useEffect(()=>{
    let kdata = sessionStorage.getItem('userData');
    if(kdata==null){
      resetSession();
    }
    
    setData(getSession());
    
  },[]);

  const [data,setData] = useState([]);

  // useEffect(()=>{
  //   console.log(sessionStorage.getItem('userData'));

  // },[]);

  const updatePrice = (row,value) => {
    
    setData(prevData => {
      const tempData = [...prevData];
      tempData.find(e => e.id === row.id).price = value;
      return tempData;
    });
  }
  
  const columns = React.useMemo(
    () => [
      {
        Header: 'Table 1',
        columns: [
          {
            Header: 'id',
            accessor: 'id',
          },
          {
            Header: 'image',
            accessor: 'image',
          },
          {
            Header: 'name',
            accessor: 'name',
            // Use a two-stage aggregator here to first
            // count the total rows being aggregated,
            // then sum any of those counts if they are
            // aggregated further
          },
          {
            Header: 'category',
            accessor: 'category',
            // Use another two-stage aggregator here to
            // first count the UNIQUE values from the rows
            // being aggregated, then sum those counts if
            // they are aggregated further
          },
          {
            Header: 'price',
            accessor: row => <input type={'number'} value={row.price} onChange={(e)=>updatePrice(row,e.target.value)}></input>,
            // sorted:true,
            // editable:true,
            sortType:(rowA,rowB,id,desc)=>{
              if(rowA.values[id]==null)
                return 0;
              if(rowB.values[id]==null)
                return 0;
              let a = Number.parseFloat(rowA.values[id].props.value);
              let b = Number.parseFloat(rowB.values[id].props.value);
              if (Number.isNaN(a)) {  // Blanks and non-numeric strings to bottom
                  a = desc ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
              }
              if (Number.isNaN(b)) {
                  b = desc ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
              }
              if (a > b) return 1; 
              if (a < b) return -1;
              return 0;
            }
            // Aggregate the average age of visitors
          },
          {
            Header: 'label',
            accessor: 'label',
            // Aggregate the sum of all visits
          },
          {
            Header: 'description',
            accessor: 'description',
          },
        ],
      },
    ],
    []
  )


  return (
    <>
    <button onClick={()=>saveSession()}> Save</button>
    <button onClick={()=>resetSession()} >Reset</button>
    {data.length>0 && <Styles>
      <Table columns={columns} data={data} />
    </Styles>}</>
  )
}

export default App
