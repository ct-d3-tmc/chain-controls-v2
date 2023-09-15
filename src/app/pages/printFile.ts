import { useRouter } from 'next/router';
import * as config from '../../utils/config.js'; 
import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';

const DATA_DIR = '../data/excelTabs.txt'
const UPLOAD_DIR = "../upload"


let postman: any;
// Content-type is not relevant in a TypeScript/HTML context

// Start of the HTML content
const htmlContent = `
<html>
<head>
    <!-- Your JavaScript library import -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <title>Chain Control CSV File</title>
    <!-- Your CSS styles -->
    <style>
    .disabled {
        opacity: 0.6;
        cursor: not-allowed;
        }

    button {
        height: 40px;
        background-color: #4CAF50; /* Green */
        border: none;
        border-radius: 8px;
        color: snow;
        padding: 8px 16px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        -webkit-transition-duration: 0.4s; /* Safari */
        transition-duration: 0.4s;
        }

    button:hover {
        box-shadow: 0 12px 16px 0 rgba(0,0,0,0.24),0 17px 50px 0 rgba(0,0,0,0.19);
        }




    /* ******************************************************************* */

    .headerDiv {
        position: -webkit-sticky;
        position: sticky;
        top: 0;
        height: 110px;
        z-index: 10;
        background: #002952;
        color: snow;
        }
    /*
    h2 {
        position: -webkit-sticky;
        position: sticky;
        top: 55;
        height: 33px;
        z-index: 10;
        background: #002952;
        width: 150%;
        }
    */

    .col_heading {
        background: slateBlue;
        z-index: 1;
        }

    .col0 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 1px;
        width: 50px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col1 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 50px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col2 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 110px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col3 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 170px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col4 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 230px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col5 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 290px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col6 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 350px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col7 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 410px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col8 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 470px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    .col9 {
        position: -webkit-sticky;
        position: sticky;
        /*left: 530px;
        width: 60px;*/
        z-index: 2;
        background: rgba( 200, 200, 200, 1 );
        }

    th.col0, th.col1, th.col2, th.col3, th.col4, th.col5, th.col6, th.col7, th.col8, th.col9 {
        background: slateBlue;
        z-index: 4;
        }

    .col10, .col11, .col12, .col13, .col14, .col15, .col16, .col17, .col18, .col19,
    .col20, .col21, .col22, .col23, .col24, .col25, .col26, .col27, .col28, .col29,
    .col30, .col31, .col32, .col33, .col34, .col35, .col36, .col37, .col38, .col39,
    .col40, .col41, .col42, .col43, .col44, .col45, .col46, .col47, .col48, .col49, {
        left: 140px;
        z-index: -3;
        }



    /* ******************************************************************* */


    table th {
        background: snow;
        /* background: #F7E7CE; */    /* TAN color from ChainControl */
        position: -webkit-sticky;
        position: sticky;
        top: 110;
        z-index: 10;
        border: solid 1px lightblue;
        }
    td {
        font-family: monospace;
        border: solid 1px lightblue;
        width: 34ch;
        overflow: hidden;
        white-space: nowrap;
        z-index: -12;
        }
    tr:nth-child( odd ) {
        background: rgba( 0, 41, 82, 0.1 );
        }
    tr:nth-child( even ) {
        background: rgba( 0, 41, 82, 0.25 );
        }
    /*.null {
        background: rgba( 127, 255, 212, 0.9 );
        border: 8px solid red;
        } */
    .tooLong, .null {
        border: 4px groove red;
        background: orange;
        }
     tr:hover {
        /* Add a grey background color to the table header and on hover */
        background-color: #A9A9A9;
        }
 
    tr.selected {
        background-color: rgba(255,255,255, 0.89);
        color: #FFA500;
        }

    tr.youHaveSelected {
        background-color: rgba(102, 178, 255, 0.99);
        font-family: fantasy;
        }


        </style>
        
        <script type="text/javascript">

            function goHome () {
                location.href = "../client/index.html";
                console.log("Tried home");
                }
            function verifyingMessageLength ( new_message ) {
                if ( new_message.search( /<br>/ ) == -1 && new_message.length < 17 )
                    return 0;
                var new_array = new_message.split( "<br>" );
                if ( new_array.length == 1 )
                    new_array.push( 0, 0 );
                else if ( new_array.length == 2 )
                    new_array.push( 0 );
                //console.log( new_array + " " + new_array[ 0 ].length + " " + new_array[ 1 ].length + " " + new_array[ 2 ].length );
                if ( new_array[ 0 ].length > 16 || new_array[ 1 ].length > 16 || new_array[ 2 ].length > 16 )
                    return 1;
                else
                    return 0;
                }

            function checkLength(){
                var table = document.getElementsByTagName("table"); //Retrieve the table
                var columns = document.getElementsByTagName("th"); //Retrieve all the elements with a th tag
                table=table[0]; //There should only be 1 table so no need for an array
                var num_rows = table.rows.length; //retrieve number of rows in table
                //console.log("Number of rows: "+num_rows);
                for (var row = 0; row < num_rows; row++) { //Iterate through all rows within table
                    //console.log("Row Value: " + row);
                    var cells = table.rows[row].getElementsByTagName('td'); //Retrieve all cells within each row
                    for(var cell_column_index = 0; cell_column_index < cells.length; cell_column_index++) { //Iterate through each cell in each row
                        if(cell_column_index>columns.length-1) { //If the columns length
                            break;
                            }
                        if(cells[cell_column_index].innerHTML.includes('<span class="null"')) {
                            continue;
                            }
                        if(columns[cell_column_index].innerHTML.includes('#')) {
                            //console.log("Column Cell: "+ cell_column_index)
                            if(verifyingMessageLength(cells[cell_column_index].innerHTML)) {
                                console.log("Row:"+row+" Column:"+cell_column_index);
                                console.log(cells[cell_column_index].innerHTML);
                                cells[cell_column_index].className='tooLong';
                                }
                            }
                        }
                    }
                checkTableWidth();
                }
            function checkTableWidth() {
                var headerName = document.getElementById("headerDiv");
                var tableName = document.getElementById("table-wrapper");
                headerName.style.width = tableName.scrollWidth;
                checkCellWidth();
                }
            function checkCellWidth() {
                var stationaryColumns = 10; //! CHANGE THIS VALUE IF YOU WANT MORE OR LESS STICKY COLUMNS!!
                var subtotalWidth = 0;
                var columnName;
                for ( var i = 0; i < stationaryColumns; i++ ) {
                    columnName = document.getElementsByClassName('col'+i)[1].offsetWidth;
                    $('.col'+i).css('left',subtotalWidth);
                    $('.col'+i).css('width',columnName);
                    subtotalWidth = columnName + subtotalWidth;
                    }
                }
                    
                
        </script>
    </head><body onload='checkLength()'>
    <div id='headerDiv' class='headerDiv'>
    <form class='buttons' action='printFile.py' method='post'>
    <button class="tablinks" type="button" onClick="goHome()"><img src="../client/img/home.png" width=32px></img> Home</button>
    `;
    const formElement = document.createElement("form");
    const router = useRouter();
    const post_name: string = router.query.post_name as string;
    const csvArray: any[] = [];
    let class_name:any , lineStrip:any;

    fs.readFile(DATA_DIR, 'utf-8', (err, data) => {
        if (err) {
        console.error(err);
        return;
        }   
        const lines = data.trim().split('\n');
        // Push each line into the csvArray
        for (let i = 0; i < lines.length; i++) {
             lineStrip = lines[i].trim();
            csvArray.push(lineStrip);
          if ((i == 0 && post_name === '') ||  (post_name === lineStrip)){
            class_name = "tablinks disabled"
          }          
        else
            class_name = "tablinks"
        
        }
        
        const buttonElement = document.createElement("button");
        buttonElement.className = class_name;
        buttonElement.type = "submit";
        buttonElement.name = "postName";
        buttonElement.value = lineStrip;
        buttonElement.textContent = lineStrip;
        buttonElement.onclick = () => console.log(lineStrip);
        formElement.appendChild(buttonElement);  
    });
document.body.appendChild(formElement);

   




/*export default async function handler(chaincontrolRequest: NextApiRequest, chaincontrolResponse: NextApiResponse) {
    const router = useRouter();
    const param1Value = router.query.param1;
    

}*/