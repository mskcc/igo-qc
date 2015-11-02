$(document).ready(function() {
	
			
	var divElement = $('div'); //log all div elements
	var inputElement = $('input'); //log all div elements
	var textareaElement = $('textarea'); //log all div elements
	
	function circle_state() {
		
	 if (divElement.hasClass('circleStats')) {
	
		$(".circleStats").css({opacity:1});
		
		
		$(".greenCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 120,
	        'height': 120,
	        'fgColor': '#a1d36e',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	   });
	
	    $(".orangeCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 120,
	        'height': 120,
	        'fgColor': '#FA5833',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	    });
	
		$(".lightOrangeCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 120,
	        'height': 120,
	        'fgColor': '#fa6f57',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	   });
	
	    $(".blueCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 120,
	        'height': 120,
	        'fgColor': '#55c1e7',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	    });
	
		$(".lavenderCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 120,
	        'height': 120,
	        'fgColor': '#ac94e9',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	   });
	
		$(".pinkCircle").knob({
	        'min':0,
	        'max':100,
	        'readOnly': true,
	        'width': 120,
	        'height': 120,
	        'fgColor': '#e42b75',
	        'dynamicDraw': true,
	        'thickness': 0.2,
	        'tickColorizeValues': true
	   }); 
	  } /*end if*/    
	}
	
	/* ---------- Charts Start ---------- */    
 	
 	//stack chart starts here
    if (divElement.hasClass('stack-chart')) {
	    	$(function() {
	
			var d1 = [];
			for (var i = 0; i <= 10; i += 1) {
				d1.push([i, parseInt(Math.random() * 30)]);
			}
	
			var d2 = [];
			for (var i = 0; i <= 10; i += 1) {
				d2.push([i, parseInt(Math.random() * 30)]);
			}
	
			var d3 = [];
			for (var i = 0; i <= 10; i += 1) {
				d3.push([i, parseInt(Math.random() * 30)]);
			}
	
			var stack = 0,
				bars = true,
				lines = false,
				steps = false;
	
			function plotWithOptions() {
				$.plot(".stack-chart",
				[
				    {data: d1, color: '#fa6f57'},
				    {data: d2, color: '#a1d36e'},
				    {data: d3, color: '#55c1e7'}
				]
				, {
					series: {
						stack: stack,
						lines: {
							show: lines,
							fill: true,
							steps: steps
						},
						bars: {
							show: bars,
							barWidth: 0.3,
							fill:1
						}
					},
					grid:{
							borderWidth: 0
					}
					
				});
			}
	
			plotWithOptions(); 
		});		
    }//stack chart end here
    
    
      //Interactive Chart
      
     
        if (divElement.hasClass('interactive-chart')) {
        	$(function() {
        		 function randValue() {
              		  return (Math.floor(Math.random() * (1 + 40 - 20))) + 20;
           		 }
	           		 var pageviews = [
	                [1, randValue()],
	                [2, randValue()],
	                [3, 2 + randValue()],
	                [4, 3 + randValue()],
	                [5, 5 + randValue()],
	                [6, 10 + randValue()],
	                [7, 15 + randValue()],
	                [8, 20 + randValue()],
	                [9, 25 + randValue()],
	                [10, 30 + randValue()],
	                [11, 35 + randValue()],
	                [12, 25 + randValue()],
	                [13, 15 + randValue()],
	                [14, 20 + randValue()],
	                [15, 45 + randValue()],
	                [16, 50 + randValue()],
	                [17, 65 + randValue()],
	                [18, 70 + randValue()],
	                [19, 85 + randValue()],
	                [20, 80 + randValue()],
	                [21, 75 + randValue()],
	                [22, 80 + randValue()],
	                [23, 75 + randValue()],
	                [24, 70 + randValue()],
	                [25, 65 + randValue()],
	                [26, 75 + randValue()],
	                [27, 80 + randValue()],
	                [28, 85 + randValue()],
	                [29, 90 + randValue()],
	                [30, 95 + randValue()]
	            ];
	            var visitors = [
	                [1, randValue() - 5],
	                [2, randValue() - 5],
	                [3, randValue() - 5],
	                [4, 6 + randValue()],
	                [5, 5 + randValue()],
	                [6, 20 + randValue()],
	                [7, 25 + randValue()],
	                [8, 36 + randValue()],
	                [9, 26 + randValue()],
	                [10, 38 + randValue()],
	                [11, 39 + randValue()],
	                [12, 50 + randValue()],
	                [13, 51 + randValue()],
	                [14, 12 + randValue()],
	                [15, 13 + randValue()],
	                [16, 14 + randValue()],
	                [17, 15 + randValue()],
	                [18, 15 + randValue()],
	                [19, 16 + randValue()],
	                [20, 17 + randValue()],
	                [21, 18 + randValue()],
	                [22, 19 + randValue()],
	                [23, 20 + randValue()],
	                [24, 21 + randValue()],
	                [25, 14 + randValue()],
	                [26, 24 + randValue()],
	                [27, 25 + randValue()],
	                [28, 26 + randValue()],
	                [29, 27 + randValue()],
	                [30, 31 + randValue()]
	            ];
	
	            var plot = $.plot($("#chart_2"), [{
	                data: pageviews,
	                label: "Unique Visits"
	            }, {
	                data: visitors,
	                label: "Page Views"
	            }], {
	                series: {
	                    lines: {
	                        show: true,
	                        lineWidth: 2,
	                        fill: true,
	                        fillColor: {
	                            colors: [{
	                                opacity: 0.05
	                            }, {
	                                opacity: 0.01
	                            }]
	                        }
	                    },
	                    points: {
	                        show: true
	                    },
	                    shadowSize: 2
	                },
	                grid: {
	                    hoverable: true,
	                    clickable: true,
	                    tickColor: "#eee",
	                    borderWidth: 0
	                },
	                colors: ["#FCB322", "#A5D16C", "#52e136"],
	                xaxis: {
	                    ticks: 11,
	                    tickDecimals: 0
	                },
	                yaxis: {
	                    ticks: 11,
	                    tickDecimals: 0
	                }
	            });
	
	
	            function showTooltip(x, y, contents) {
	                $('<div id="tooltip">' + contents + '</div>').css({
	                    position: 'absolute',
	                    display: 'none',
	                    top: y + 5,
	                    left: x + 15,
	                    border: '1px solid #333',
	                    padding: '4px',
	                    color: '#fff',
	                    'border-radius': '3px',
	                    'background-color': '#333',
	                    opacity: 0.80
	                }).appendTo("body").fadeIn(200);
	            }
	
	            var previousPoint = null;
	            $("#chart_2").bind("plothover", function (event, pos, item) {
	                $("#x").text(pos.x.toFixed(2));
	                $("#y").text(pos.y.toFixed(2));
	
	                if (item) {
	                    if (previousPoint != item.dataIndex) {
	                        previousPoint = item.dataIndex;
	
	                        $("#tooltip").remove();
	                        var x = item.datapoint[0].toFixed(2),
	                            y = item.datapoint[1].toFixed(2);
	
	                        showTooltip(item.pageX, item.pageY, item.series.label + " of " + x + " = " + y);
	                    }
	                } else {
	                    $("#tooltip").remove();
	                    previousPoint = null;
	                }
	            });
        	});	
        }
       
	/*Interactive Chart end*/
	
	//Donut simple chart
    if (divElement.hasClass('simple-donut')) {
	$(function () {
		var data = [
		    { label: "USA",  data: 38, color: "#88bbc8"},
		    { label: "Brazil",  data: 23, color: "#ed7a53"},
		    { label: "India",  data: 15, color: "#9FC569"},
		    { label: "Turkey",  data: 9, color: "#bbdce3"},
		    { label: "France",  data: 7, color: "#9a3b1b"},
		    { label: "China",  data: 5, color: "#5a8022"},
		    { label: "Germany",  data: 3, color: "#2c7282"}
		];

	    $.plot($(".simple-donut"), data, 
		{
			series: {
				pie: { 
					show: true,
					innerRadius: 0.4,
					highlight: {
						opacity: 0.1
					},
					radius: 1,
					stroke: {
						color: '#fff',
						width: 8
					},
					startAngle: 2,
				    combine: {
	                    color: '#353535',
	                    threshold: 0.05
	                },
	                label: {
	                    show: true,
	                    radius: 1,
	                    formatter: function(label, series){
	                        return '<div class="pie-chart-label">'+label+'&nbsp;'+Math.round(series.percent)+'%</div>';
	                    }
	                }
				},
				grow: {	active: false}
			},
			legend:{show:false},
			grid: {
	            hoverable: true,
	            clickable: true
	        },
	        tooltip: true, //activate tooltip
			tooltipOpts: {
				content: "%s : %y.1"+"%",
				shifts: {
					x: -30,
					y: -50
				}
			}
		});
	});
	}//end if
	
	//Pie simple chart
    if (divElement.hasClass('simple-pie')) {
	$(function () {
		var data = [
		    { label: "USA",  data: 38, color: "#88bbc8"},
		    { label: "Brazil",  data: 23, color: "#ed7a53"},
		    { label: "India",  data: 15, color: "#9FC569"},
		    { label: "Turkey",  data: 9, color: "#bbdce3"},
		    { label: "France",  data: 7, color: "#9a3b1b"},
		    { label: "China",  data: 5, color: "#5a8022"},
		    { label: "Germany",  data: 3, color: "#2c7282"}
		];

	    $.plot($(".simple-pie"), data, 
		{
			series: {
				pie: { 
					show: true,
					highlight: {
						opacity: 0.1
					},
					radius: 1,
					stroke: {
						color: '#fff',
						width: 2
					},
					startAngle: 2,
				    combine: {
	                    color: '#353535',
	                    threshold: 0.05
	                },
	                label: {
	                    show: true,
	                    radius: 1,
	                    formatter: function(label, series){
	                        return '<div class="pie-chart-label">'+label+'&nbsp;'+Math.round(series.percent)+'%</div>';
	                    }
	                }
				},
				grow: {	active: false}
			},
			legend:{show:false},
			grid: {
	            hoverable: true,
	            clickable: true
	        },
	        tooltip: true, //activate tooltip
			tooltipOpts: {
				content: "%s : %y.1"+"%",
				shifts: {
					x: -30,
					y: -50
				}
			}
		});
	});
	}//end if
	
 	/* Annotating chart javascript*/
	 if (divElement.hasClass('annotating')) {
			$(function() {
			
					var d1 = [];
					for (var i = 0; i < 20; ++i) {
						d1.push([i, Math.sin(i)]);
					}
					 
			
					var data = [{ data: d1, label: "Pressure", color: "#fa6f57" }];
			
					var markings = [
						{ color: "#f6f6f6", yaxis: { from: 1 } },
						{ color: "#f6f6f6", yaxis: { to: -1 } },
						{ color: "#000", lineWidth: 1, xaxis: { from: 2, to: 2 } },
						{ color: "#000", lineWidth: 1, xaxis: { from: 8, to: 8 } }
					];
			
					var placeholder = $(".annotating");
			
					var plot = $.plot(placeholder, data, {
						bars: { show: true, barWidth: 0.5, fill: 0.9 },
						xaxis: { ticks: [], autoscaleMargin: 0.02 },
						yaxis: { min: -2, max: 2 },
						grid: { markings: markings }
					});
			
					var o = plot.pointOffset({ x: 2, y: -1.2});
			
					// Append it to the placeholder that Flot already uses for positioning
			
					placeholder.append("<div style='position:absolute;left:" + (o.left + 4) + "px;top:" + o.top + "px;color:#666;font-size:smaller'>Warming up</div>");
			
					o = plot.pointOffset({ x: 8, y: -1.2});
					placeholder.append("<div style='position:absolute;left:" + (o.left + 4) + "px;top:" + o.top + "px;color:#666;font-size:smaller'>Actual measurements</div>");
			
					// Draw a little arrow on top of the last label to demonstrate canvas
					// drawing
			
					var ctx = plot.getCanvas().getContext("2d");
					ctx.beginPath();
					o.left += 4;
					ctx.moveTo(o.left, o.top);
					ctx.lineTo(o.left, o.top - 10);
					ctx.lineTo(o.left + 10, o.top - 5);
					ctx.lineTo(o.left, o.top);
					ctx.fillStyle = "#000";
					ctx.fill();
			
					// Add the Flot version string to the footer
			
					$("#footer").prepend("Flot " + $.plot.version + " &ndash; ");
				});
	
	}//end if
	
	/* Basic option chart*/
	if (divElement.hasClass('basic-placeholder')) {
			$(function () {
		
				var d1 = [];
				for (var i = 0; i < Math.PI * 2; i += 0.25) {
					d1.push([i, Math.sin(i)]);
				}
		
				var d2 = [];
				for (var i = 0; i < Math.PI * 2; i += 0.25) {
					d2.push([i, Math.cos(i)]);
				}
		
				var d3 = [];
				for (var i = 0; i < Math.PI * 2; i += 0.1) {
					d3.push([i, Math.tan(i)]);
				}
		
				$.plot(".basic-placeholder", [
					{ label: "sin(x)", data: d1 },
					{ label: "cos(x)", data: d2 },
					{ label: "tan(x)", data: d3 }
				], {
					series: {
						lines: { show: true },
						points: { show: true }
					},
					xaxis: {
						ticks: [
							0, [ Math.PI/2, "\u03c0/2" ], [ Math.PI, "\u03c0" ],
							[ Math.PI * 3/2, "3\u03c0/2" ], [ Math.PI * 2, "2\u03c0" ]
						]
					},
					yaxis: {
						ticks: 10,
						min: -2,
						max: 2,
						tickDecimals: 3
					},
					grid: {
						backgroundColor: { colors: [ "#fff", "#eee" ] },
						borderWidth: {
							top: 1,
							right: 1,
							bottom: 2,
							left: 2
						}
					}
				});
		 
			});
	}//end if
	
	//Auto update chart
    if (divElement.hasClass('auto-update-chart')) {
	$(function () {
		// we use an inline data source in the example, usually data would
	    // be fetched from a server
	    var data = [], totalPoints = 300;
	    function getRandomData() {
	        if (data.length > 0)
	            data = data.slice(1);

	        // do a random walk
	        while (data.length < totalPoints) {
	            var prev = data.length > 0 ? data[data.length - 1] : 50;
	            var y = prev + Math.random() * 10 - 5;
	            if (y < 0)
	                y = 0;
	            if (y > 100)
	                y = 100;
	            data.push(y);
	        }

	        // zip the generated y values with the x values
	        var res = [];
	        for (var i = 0; i < data.length; ++i)
	            res.push([i, data[i]])
	        return res;
	    }

	    // Update interval
	    var updateInterval = 200;

	    // setup plot
	    var options = {
	        series: { 
	        	grow: {active:false}, //disable auto grow
	        	shadowSize: 0, // drawing is faster without shadows
	        	lines: {
            		show: true,
            		fill: true,
            		lineWidth: 2,
            		steps: false
	            }
	        },
	        grid: {
				show: true,
			    aboveData: false,
			    color: "#3f3f3f" ,
			    labelMargin: 5,
			    axisMargin: 0, 
			    borderWidth: 0,
			    borderColor:null,
			    minBorderMargin: 5 ,
			    clickable: true, 
			    hoverable: true,
			    autoHighlight: false,
			    mouseActiveRadius: 20
			}, 
			colors: chartColours,
	        tooltip: true, //activate tooltip
			tooltipOpts: {
				content: "Value is : %y.0",
				shifts: {
					x: -30,
					y: -50
				}
			},	
	        yaxis: { min: 0, max: 100 },
	        xaxis: { show: true}
	    };
	    var plot = $.plot($(".auto-update-chart"), [ getRandomData() ], options);

	    function update() {
	        plot.setData([ getRandomData() ]);
	        // since the axes don't change, we don't need to call plot.setupGrid()
	        plot.draw();
	        
	        setTimeout(update, updateInterval);
	    }

	    update();
	});
	}//end if
	
	var chartColours = ['#88bbc8', '#ed7a53', '#9FC569', '#bbdce3', '#9a3b1b', '#5a8022', '#2c7282'];
	
	/* ---------- Data Table ---------- */   
	if($('table').hasClass('dynamicTable')){
					$('.dynamicTable').dataTable({
						"sPaginationType": "full_numbers",
						"bJQueryUI": false,
						"bAutoWidth": false,
						"bLengthChange": false,
						"fnInitComplete": function(oSettings, json) {
					      $('.dataTables_filter>label>input').attr('id', 'search');
					    }
					});
				} 
	/* ---------- Data Table ---------- */   
	
	/*------------ For team thumbnail animation  ------------ */
	$('.team-thumbnail').hover(
		  function () {
		    $(this).addClass("animated bounce");
		  },
		  function () {
		    $(this).removeClass("animated bounce");
		  }
	);
	
	function choosenSelect () {
        if (!jQuery().chosen) {
            return;
        }
        $(".chosen").chosen();
        $(".chosen-with-diselect").chosen({
            allow_single_deselect: true
        });
    }
	
	/* -------Color Picker ---------- */
	 function colorPicker() {
        if (!jQuery().colorpicker) {
            return;
        }
        $('.colorpicker-default').colorpicker({
            format: 'hex'
        });
        $('.colorpicker-rgba').colorpicker();
    }
    
    /* -------Date Picker ---------- */
     function dateTimePickers() {
 
 		
 		if (inputElement.hasClass('date-picker')) {
 				$('.date-picker').datepicker();
 		}
         
        if (inputElement.hasClass('timepicker-default')) {
 				 $('.timepicker-default').timepicker();
 		} 
 
    }
    
     /* -------Editor---------- */
    function editorWysihtml5() {
    	  if (textareaElement.hasClass('textarea')) {
		    	 $('.textarea').wysihtml5();
				 $(prettyPrint);
		  }
        if (!jQuery().wysihtml5) {
            return;
        }

        if ($('.wysihtml5').size() > 0) {
            $('.wysihtml5').wysihtml5();
            
        }
       
    }
    
    /* ---------Pretty Photos ---------- */
   
   
   function prettyphotointi(){
   	
   		 if (divElement.hasClass('gallery-block')) {
  			 $("a[data-link^='prettyPhoto']").prettyPhoto({
					show_title : true, 
					social_tools : false,
					hook : "data-link",
					overlay_gallery : false,
				});
		}
    } 
	
	/* -------Plug in Initialization ---------- */
	function init_template(){
			circle_state();
			choosenSelect();
			colorPicker();
			dateTimePickers();
			editorWysihtml5();
			prettyphotointi();
			
	}
	init_template();
	$('.tooltips').tooltip();
	$('.popover-btn').popover();
	$('.popover-ele').popover(); 
	
 });
 