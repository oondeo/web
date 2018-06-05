//  @@@ web_export_view custom JS @@@
//#############################################################################
//    
//    Copyright (C) 2012 Agile Business Group sagl (<http://www.agilebg.com>)
//    Copyright (C) 2012 Therp BV (<http://therp.nl>)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU Affero General Public License as published
//    by the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Affero General Public License for more details.
//
//    You should have received a copy of the GNU Affero General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
//#############################################################################
openerp.web_export_view = function (instance) {

    var _t = instance.web._t, QWeb = instance.web.qweb;

    instance.web.ListView.include({       
     
        // render_buttons: function($node) {
        //         var self = this;
        //         this._super($node);
        //         self.$el.find('.oe_sidebar').append(QWeb.render('AddExportViewMain', {widget: self}));
        //             // self.$el.find('.oe_sidebar_export_view_xls').on('click', self.on_sidebar_export_view_xls);
        //             // self.$el.find('.oe_sidebar_export_view_xls_all').on('click', self.on_sidebar_export_view_xls_all);
        //        this.$buttons.find('.o_list_export_view_xls_all').click(this.proxy('tree_view_action'));
        // },
 
        // tree_view_action: function () {           
        //     var self = this,
        //         view = this.getParent(),
        //         fields_view = view.fields_view,
        //         children = view.getChildren(),
        //         deferred = new jQuery.Deferred();                 
        //     this.do_action({               
        //         type: "ir.actions.act_window",               
        //         name: "product",               
        //         res_model: "product.template",               
        //         views: [[false,'form']],               
        //         target: 'current',               
        //         view_type : 'form',               
        //         view_mode : 'form',               
        //         flags: {'form': {'action_buttons': true, 'options': {'mode': 'edit'}}}
        //     });
        //     return { 'type': 'ir.actions.client','tag': 'reload', } 
        //  } 
 
        load_list: function(data) {

            var self = this;
            this._super(data);        

            // console.log(data);
            // console.log(this.$buttons);

            if (this.$buttons) {
                this.$buttons.find('.oe_sidebar_export_view_xls').unbind("click").click(this.proxy('on_sidebar_export_view_xls'));
                this.$buttons.find('.oe_sidebar_export_view_csv').unbind("click").click(this.proxy('on_sidebar_export_view_csv'));
                this.$buttons.find('.oe_sidebar_export_view_xls_default').unbind("click").click(this.proxy('on_sidebar_export_view_xls_default')) ;
                //on_sidebar_export_view_xls_default
            }
        },     
       
        on_sidebar_export_view_csv: function (){
            this.export_view("csv");
            return false;
        }, 

        on_sidebar_export_view_xls: function (){
            this.export_view("xls");
            return false;
        }, 
        
        export_view: function (fmt) {
            // Select the first list of the current (form) view
            // or assume the main view is a list view and use that
            var self = this,
                view = this,
                fields_view = view.fields_view,
                children = view.getChildren(),
                deferred = new jQuery.Deferred();
            var domain = view.dataset.domain;
            // console.log(domain);
            // console.log(view);
            // console.log(children);
            // console.log(this.dataset);

            if (children) {
                children.every(function (child) {
                    if (child.field && child.field.type == 'one2many') {
                        view = child.viewmanager.views.list.controller;
                        return false; // break out of the loop
                    }
                    if (child.field && child.field.type == 'many2many') {
                        view = child.list_view;
                        return false; // break out of the loop
                    }
                    return true;
                });
            }
            export_columns_keys = [];
            export_columns_names = [];
            $.each(view.visible_columns, function () {
                if (this.tag == 'field') {
                    // non-fields like `_group` or buttons
                    export_columns_keys.push(this.id);
                    export_columns_names.push(this.string);
                }
            });
            if(view.$(
                'tr.oe_list_header_columns > th > ' +
                'input.oe_list_record_selector:checked'
            ).length == 0) {
                row_ids = view.$(
                    '.oe_list_content > tbody > tr[data-id]' +
                    ':has(th.oe_list_record_selector > input:checked)'
                ).map(function() {
                    return parseInt(jQuery(this).data('id'));
                }).toArray();
                deferred = view.dataset.read_ids(row_ids, export_columns_keys);
            }
            else {
                deferred = view.dataset.read_slice(export_columns_keys);
                export_columns_names.push(
                    _t('Selected records:') + ' ' +
                    String(
                        _(view.ViewManager.searchview.query.pluck('values'))
                        .chain().flatten(true).pluck('label').value()
                        .join('; ') || _('All records')
                    )
                );
            }
            var x2many = _(export_columns_keys).filter(function(field) {
                return ['one2many', 'many2many']
                    .indexOf(fields_view.fields[field].type) > -1;
            });
            if(x2many.length) {
                deferred = deferred.then(function(records) {
                    var name_gets = [], names = {};
                    _(records).chain().map(function(record) {
                        return _(record).chain().pairs().filter(function(pair)
                        {
                            return x2many.indexOf(pair[0]) > -1;
                        })
                        .value()
                    })
                    .flatten(true)
                    .groupBy(0)
                    .each(function(pairs, field) {
                        name_gets.push(
                            new instance.web.Model(
                                fields_view.fields[field].relation
                            )
                            .call('name_get', [
                                _(pairs).chain().pluck(1).flatten(true)
                                .value(),
                                view.dataset.get_context()
                            ])
                            .then(function(name_gets) {
                                names[field] = _.object(name_gets);
                            })
                        );
                    })
                    return jQuery.when.apply(jQuery, name_gets)
                    .then(function() {
                        _(records).each(function(record) {
                            _(x2many).each(function(field) {
                                record[field] = _(record[field])
                                .map(function(id) {
                                    return names[field][id];
                                })
                                .join(', ');
                                record[
                                    _.str.sprintf('%s__display', field)
                                ] = record[field];
                            });
                        });
                        return records;
                    });
                });
            }
            return deferred.then(function(records) {
                var export_rows = [];
                $.each(records, function(index, record) {
                    var export_row = [],
                        record = new instance.web.list.Record(record).toForm();
                    $.each(view.visible_columns, function() {
                        if(this.tag == 'field'){
                            export_row.push(
                                this.type != 'integer' && this.type != 'float' ?
                                jQuery('<div/>').html(this.format(
                                    record.data, {process_modifiers: false}
                                )).text() : record.data[this.id].value
                            );
                        };
                    })
                    export_rows.push(export_row);
                });
                view.session.get_file({
                    url: '/web/export/'+fmt+'_view',
                    data: {data: JSON.stringify({
                        model: view.model,
                        headers: export_columns_names,
                        header_keys: export_columns_keys,
                        domain: domain,
                        rows: export_rows,
                    })},
                });
            });
        },
        on_sidebar_export_view_xls_default: function() {
            new instance.web.DataExport(this, this.dataset).open();
            return false;
        },

    });
 

    // instance.web.Sidebar.include({
    //     redraw: function () {
    //         var self = this;
    //         this._super.apply(this, arguments);
    //         if (self.getParent().ViewManager.active_view == 'list') {
    //             self.$el.find('.oe_sidebar').append(QWeb.render('AddExportViewMain', {widget: self}));
    //             self.$el.find('.oe_sidebar_export_view_xls').on('click', self.on_sidebar_export_view_xls);
    //             self.$el.find('.oe_sidebar_export_view_xls_all').on('click', self.on_sidebar_export_view_xls_all);
    //         }
    //     },

    //     on_sidebar_export_view_xls: function (e, active_domain) {
    //         // Select the first list of the current (form) view
    //         // or assume the main view is a list view and use that
    //         var self = this,
    //             view = this.getParent(),
    //             fields_view = view.fields_view,
    //             children = view.getChildren(),
    //             deferred = new jQuery.Deferred();
    //         if (children) {
    //             children.every(function (child) {
    //                 if (child.field && child.field.type == 'one2many') {
    //                     view = child.viewmanager.views.list.controller;
    //                     return false; // break out of the loop
    //                 }
    //                 if (child.field && child.field.type == 'many2many') {
    //                     view = child.list_view;
    //                     return false; // break out of the loop
    //                 }
    //                 return true;
    //             });
    //         }
    //         export_columns_keys = [];
    //         export_columns_names = [];
    //         $.each(view.visible_columns, function () {
    //             if (this.tag == 'field') {
    //                 // non-fields like `_group` or buttons
    //                 export_columns_keys.push(this.id);
    //                 export_columns_names.push(this.string);
    //             }
    //         });
    //         if(view.$(
    //             'tr.oe_list_header_columns > th > ' +
    //             'input.oe_list_record_selector:checked'
    //         ).length == 0) {
    //             row_ids = view.$(
    //                 '.oe_list_content > tbody > tr[data-id]' +
    //                 ':has(th.oe_list_record_selector > input:checked)'
    //             ).map(function() {
    //                 return parseInt(jQuery(this).data('id'));
    //             }).toArray();
    //             deferred = view.dataset.read_ids(row_ids, export_columns_keys);
    //         }
    //         else {
    //             deferred = view.dataset.read_slice(export_columns_keys);
    //             export_columns_names.push(
    //                 _t('Selected records:') + ' ' +
    //                 String(
    //                     _(view.ViewManager.searchview.query.pluck('values'))
    //                     .chain().flatten(true).pluck('label').value()
    //                     .join('; ') || _('All records')
    //                 )
    //             );
    //         }
    //         var x2many = _(export_columns_keys).filter(function(field) {
    //             return ['one2many', 'many2many']
    //                 .indexOf(fields_view.fields[field].type) > -1;
    //         });
    //         if(x2many.length) {
    //             deferred = deferred.then(function(records) {
    //                 var name_gets = [], names = {};
    //                 _(records).chain().map(function(record) {
    //                     return _(record).chain().pairs().filter(function(pair)
    //                     {
    //                         return x2many.indexOf(pair[0]) > -1;
    //                     })
    //                     .value()
    //                 })
    //                 .flatten(true)
    //                 .groupBy(0)
    //                 .each(function(pairs, field) {
    //                     name_gets.push(
    //                         new instance.web.Model(
    //                             fields_view.fields[field].relation
    //                         )
    //                         .call('name_get', [
    //                             _(pairs).chain().pluck(1).flatten(true)
    //                             .value(),
    //                             view.dataset.get_context()
    //                         ])
    //                         .then(function(name_gets) {
    //                             names[field] = _.object(name_gets);
    //                         })
    //                     );
    //                 })
    //                 return jQuery.when.apply(jQuery, name_gets)
    //                 .then(function() {
    //                     _(records).each(function(record) {
    //                         _(x2many).each(function(field) {
    //                             record[field] = _(record[field])
    //                             .map(function(id) {
    //                                 return names[field][id];
    //                             })
    //                             .join(', ');
    //                             record[
    //                                 _.str.sprintf('%s__display', field)
    //                             ] = record[field];
    //                         });
    //                     });
    //                     return records;
    //                 });
    //             });
    //         }
    //         return deferred.then(function(records) {
    //             var export_rows = [];
    //             $.each(records, function(index, record) {
    //                 var export_row = [],
    //                     record = new instance.web.list.Record(record).toForm();
    //                 $.each(view.visible_columns, function() {
    //                     if(this.tag == 'field'){
    //                         export_row.push(
    //                             this.type != 'integer' && this.type != 'float' ?
    //                             jQuery('<div/>').html(this.format(
    //                                 record.data, {process_modifiers: false}
    //                             )).text() : record.data[this.id].value
    //                         );
    //                     };
    //                 })
    //                 export_rows.push(export_row);
    //             });
    //             view.session.get_file({
    //                 url: '/web/export/xls_view',
    //                 data: {data: JSON.stringify({
    //                     model: view.model,
    //                     headers: export_columns_names,
    //                     rows: export_rows,
    //                 })},
    //             });
    //         });
    //     },

    //     on_sidebar_export_view_xls_all: function (e, active_domain) {
    //         // Select the first list of the current (form) view
    //         // or assume the main view is a list view and use that
    //         var self = this,
    //             view = this.getParent(),
    //             fields_view = view.fields_view,
    //             children = view.getChildren(),
    //             deferred = new jQuery.Deferred();
    //         if (children) {
    //             children.every(function (child) {
    //                 if (child.field && child.field.type == 'one2many') {
    //                     view = child.viewmanager.views.list.controller;
    //                     return false; // break out of the loop
    //                 }
    //                 if (child.field && child.field.type == 'many2many') {
    //                     view = child.list_view;
    //                     return false; // break out of the loop
    //                 }
    //                 return true;
    //             });
    //         }
    //         export_columns_keys = [];
    //         export_columns_names = [];
    //         $.each(view.visible_columns, function () {
    //             if (this.tag == 'field') {
    //                 // non-fields like `_group` or buttons
    //                 export_columns_keys.push(this.id);
    //                 export_columns_names.push(this.string);
    //                 return false;
    //             }
    //         });
    //         if(view.$(
    //             'tr.oe_list_header_columns > th > ' +
    //             'input.oe_list_record_selector:checked'
    //         ).length == 0) {
    //             row_ids = view.$(
    //                 '.oe_list_content > tbody > tr[data-id]' +
    //                 ':has(th.oe_list_record_selector > input:checked)'
    //             ).map(function() {
    //                 return parseInt(jQuery(this).data('id'));
    //             }).toArray();
    //             deferred = view.dataset.read_ids(row_ids, export_columns_keys);
    //         }
    //         else {
    //             deferred = view.dataset.read_slice(export_columns_keys);
    //             export_columns_names.push(
    //                 _t('Selected records:') + ' ' +
    //                 String(
    //                     _(view.ViewManager.searchview.query.pluck('values'))
    //                     .chain().flatten(true).pluck('label').value()
    //                     .join('; ') || _('All records')
    //                 )
    //             );
    //         }
    //         var x2many = _(export_columns_keys).filter(function(field) {
    //             return ['one2many', 'many2many']
    //                 .indexOf(fields_view.fields[field].type) > -1;
    //         });
    //         if(x2many.length) {
    //             deferred = deferred.then(function(records) {
    //                 var name_gets = [], names = {};
    //                 _(records).chain().map(function(record) {
    //                     return _(record).chain().pairs().filter(function(pair)
    //                     {
    //                         return x2many.indexOf(pair[0]) > -1;
    //                     })
    //                     .value()
    //                 })
    //                 .flatten(true)
    //                 .groupBy(0)
    //                 .each(function(pairs, field) {
    //                     name_gets.push(
    //                         new instance.web.Model(
    //                             fields_view.fields[field].relation
    //                         )
    //                         .call('name_get', [
    //                             _(pairs).chain().pluck(1).flatten(true)
    //                             .value(),
    //                             view.dataset.get_context()
    //                         ])
    //                         .then(function(name_gets) {
    //                             names[field] = _.object(name_gets);
    //                         })
    //                     );
    //                 })
    //                 return jQuery.when.apply(jQuery, name_gets)
    //                 .then(function() {
    //                     _(records).each(function(record) {
    //                         _(x2many).each(function(field) {
    //                             record[field] = _(record[field])
    //                             .map(function(id) {
    //                                 return names[field][id];
    //                             })
    //                             .join(', ');
    //                             record[
    //                                 _.str.sprintf('%s__display', field)
    //                             ] = record[field];
    //                         });
    //                     });
    //                     return records;
    //                 });
    //             });
    //         }
    //         return deferred.then(function(records) {
    //             var export_rows = [];
    //             $.each(records, function(index, record) {
    //                 var export_row = [],
    //                     record = new instance.web.list.Record(record).toForm();
    //                 $.each(view.visible_columns, function() {
    //                     if(this.tag == 'field'){
    //                         export_row.push(
    //                             this.type != 'integer' && this.type != 'float' ?
    //                             jQuery('<div/>').html(this.format(
    //                                 record.data, {process_modifiers: false}
    //                             )).text() : record.data[this.id].value
    //                         );
    //                     };
    //                 })
    //                 export_rows.push(export_row);
    //             });
    //             view.session.get_file({
    //                 url: '/web/export/xls_view_all',
    //                 data: {data: JSON.stringify({
    //                     model: view.model,
    //                     headers: export_columns_names,
    //                     rows: export_rows,
    //                 })},
    //             });
    //         });
    //     }        
    // });

};
