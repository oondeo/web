# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2012 Domsense srl (<http://www.domsense.com>)
#    Copyright (C) 2012-2013:
#        Agile Business Group sagl (<http://www.agilebg.com>)
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as published
#    by the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
try:
    import json
except ImportError:
    import simplejson as json

import logging
import openerp
import openerp.http as http
from openerp.http import request
from openerp.addons.web.controllers.main import ExcelExport,CSVExport

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
        model = data.get('model', [])
        columns_headers = data.get('headers', [])
        columns_keys = data.get('header_keys', [])
        domain = data.get('domain',[])
        rows = data.get('rows', [])

        if not rows:
            _logger.debug(domain)
            Model = request.registry.get(model)
            for res in Model.search_read(request.cr,uid,domain):
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
        model = data.get('model', [])
        columns_headers = data.get('headers', [])
        columns_keys = data.get('header_keys', [])
        domain = data.get('domain',[])
        rows = data.get('rows', [])

        if not rows:
            _logger.debug(domain)
            Model = request.registry.get(model)
            for res in Model.search_read(request.cr,uid,domain):
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
