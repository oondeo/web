# -*- coding: utf-8 -*-
# Copyright 2016 Henry Zhou (http://www.maxodoo.com)
# Copyright 2016 Rodney (http://clearcorp.cr/)
# Copyright 2012 Agile Business Group
# Copyright 2012 Therp BV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import json
import odoo.http as http
from odoo.http import request
from odoo.addons.web.controllers.main import ExcelExport,CSVExport

import logging

_logger = logging.getLogger(__name__)

class ExcelExportView(ExcelExport):
    def __getattribute__(self, name):
        if name == 'fmt':
            raise AttributeError()
        return super(ExcelExportView, self).__getattribute__(name)

    @http.route('/web/export/xls_view', type='http', auth='user')
    def export_xls_view(self, data, token):
        uid = request.session.uid
        data = json.loads(data)
        model = data.get('model', '')
        columns_headers = data.get('headers', [])
        columns_keys = data.get('header_keys', [])
        domain = data.get('domain',[])
        rows = data.get('rows', [])

        if not rows:
            _logger.debug(domain)
            Model = request.env[model] #request.registry.get(model)
            for res in Model.search_read(domain):
                # _logger.debug(res)
                row = []
                for k in columns_keys:
                    try:
                        if isinstance(res[k],basestring):
                           row.append(unicode(res[k])) 
                        elif res[k]:
                            row.append(res[k][1])
                        else:
                            row.append("")
                    except:
                        try:
                            row.append(unicode(res[k]))
                        except:
                            row.append("")
                _logger.debug(row)
                rows.append(row)

        return request.make_response(
            self.from_data(columns_headers, rows),
            headers=[
                ('Content-Disposition', 'attachment; filename="%s"'
                 % self.filename(model)),
                ('Content-Type', self.content_type)
            ],
            cookies={'fileToken': token}
        )


class CSVExportView(CSVExport):
    def __getattribute__(self, name):
        if name == 'fmt':
            raise AttributeError()
        return super(CSVExportView, self).__getattribute__(name)

    @http.route('/web/export/csv_view', type='http', auth='user')
    def export_csv_view(self, data, token):
        uid = request.session.uid
        data = json.loads(data)
        model = data.get('model', '')
        columns_headers = data.get('headers', [])
        columns_keys = data.get('header_keys', [])
        domain = data.get('domain',[])
        rows = data.get('rows', [])

        if not rows:
            _logger.debug(domain)
            Model = request.env[model]
            for res in Model.search_read(domain):
                # _logger.debug(res)
                row = []
                for k in columns_keys:
                    try:
                        if isinstance(res[k],basestring):
                           row.append(unicode(res[k])) 
                        elif res[k]:
                            row.append(res[k][1])
                        else:
                            row.append("")
                    except:
                        try:
                            row.append(unicode(res[k]))
                        except:
                            row.append("")
                _logger.debug(row)
                rows.append(row)

        return request.make_response(
            self.from_data(columns_headers, rows),
            headers=[
                ('Content-Disposition', 'attachment; filename="%s"'
                 % self.filename(model)),
                ('Content-Type', self.content_type)
            ],
            cookies={'fileToken': token}
        )


class ExcelExportExtend(ExcelExport):
    @http.route('/web/export/xls', type='http', auth="user")
    def index(self,data,token):
        return super(ExcelExportExtend, self).index(data, token)


class CSVExportExtend(CSVExport):
    @http.route('/web/export/csv', type='http', auth="user")
    def index(self,data,token):     
        return super(CSVExportExtend, self).index(data, token)    

