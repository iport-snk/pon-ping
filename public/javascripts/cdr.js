Vue.component('i-cdr', {
    template: `
        <b-table ref="cdr"
            :items = "filtered" 
            :fields = "fields"
            :tbody-tr-class = "getRowVariant"
        >
            <template slot="origin" slot-scope="row">
                 <div><b-link href="#" v-if = "row.item.contract">{{row.item.contract}}</b-link></div>
                 <div :style = 'row.item.contract ? {fontSize:  ".85rem"} : ""'>
                    {{row.item.srcNumber.substring(0, 3) + " " + row.item.srcNumber.substring(3, 6) + " " + row.item.srcNumber.substring(6)}}
             
                </div>
            </template>
            
            <template slot="category" slot-scope="row">
                    <div style = 'font-size: .85rem'>
                        {{getCategory(row, 0)}}
                    </div>
                    <div style = 'font-size: .85rem'>
                        {{getCategory(row, 1)}}
                    </div>
      
            </template>
            
            <template slot="row-details" slot-scope="row">
                <b-card bg-variant="light">
                    <b-alert 
                        variant="success" 
                        :show="!!row.item.client"
                    >
                        {{ getClientInfo(row.item) }}
                    </b-alert>
                    <b-row class="mb-2">
                        <b-col sm="2" class="text-sm-right"><b>Описание:</b></b-col>
                        <b-col>
                            <b-form-input v-model="row.item.description"
                                type = "text" >
                            </b-form-input>
                        </b-col>
                    </b-row>
                    <b-row class="mb-2">
                        <b-col sm="2" class="text-sm-right"><b>Договор:</b></b-col>
                        <b-col>
                            <b-input-group>
                                <b-form-input v-model="row.item.contract"
                                    type = "text" >
                                </b-form-input>
                                <b-input-group-append>
                                    <b-btn @click="checkContract(row)"><i class="fas fa-search"></i></b-btn>
                                </b-input-group-append>
                            </b-input-group>
                        </b-col>
                    </b-row>
                    <b-row class="mb-2">
                        <b-col sm="2" class="text-sm-right"><b>Категория:</b></b-col>
                        <b-col>
                            <b-input-group>
                                <b-form-select v-model="row.item.category" :options="categories" :disabled="!!row.item.jira" />
                                <b-input-group-append v-if="!row.item.jira">                               
                                    <b-button  @click="processJira(row.item)">{{getJiraLabel(row.item)}}</b-button>
                                </b-input-group-append>
                            </b-input-group>
                        </b-col>
                    </b-row>
                    <b-row style = "margin-top:50px;">
                        <b-col align="left" v-if="addNumberButtonAvailable(row.item)">
                            <b-button @click="addNumber(row.item)">Добавить номер</b-button>
                        </b-col>
                        <b-col align="right">
                            <b-button variant="primary" @click="saveRecord(row)">Сохранить</b-button>
                        </b-col>
                    </b-row>
                    
                </b-card>
                
            </template>
            <template slot="jira" slot-scope="row">
                <b-link :href="'http://jira.iport.net.ua/browse/' + row.item.jira" target = "_blank" >{{row.item.jira}}</b-link>
            </template>
            <template slot="show_details" slot-scope="row">
                <i style = "color:#007bff" class="fas fa-sticky-note" v-if="row.item.description" v-b-tooltip.hover :title="row.item.description"></i>
                <b-link href="#" @click.stop="filterOut(row, $event.target)" >
                    <i class="fas fa-search"></i>
                </b-link>
                <b-link href="#" :disabled="editingDisabled(row.item)" @click.stop="showDetails(row, $event.target)" >
                    <i :class="['fas', row.detailsShowing ? 'fa-angle-double-up' : 'fa-angle-double-down']"></i>
                </b-link>
            </template>
        </b-table>
    `,
    data: function () {
        return {
            fields: [{
                label: 'Абонент', key: 'origin',
                tdClass: (idx, name, row) => row.contract ? 'zero-padding' : ''
            },{
                label: 'Время', key: 'receivedTheCall',
                formatter: _ => moment.unix(_ / 1000).format('HH:mm:ss DD.MM.YYYY')
            },{
                label: 'Категория', key: 'category',
                tdClass: 'zero-padding'
            },{
                label: 'Заявка', key: 'jira'
            },{
                label: '', key: 'show_details', tdAttr: {align: "right"}
            }],
            search: null,
            items: [],
            extNumber: null,
            categories: [
                { value: 'order.inst', text: 'Заявка - подключение', project: 'HD' },
                { value: 'order.service', text: 'Заявка - услуга', project: 'HD' },
                { value: 'order.fix', text: 'Заявка - ремонт', project: 'HD' },
                { value: 'quest.inst', text: 'Консультация - подключение', project: 'CRM' },
                { value: 'quest.fin', text: 'Консультация - финансы' , project: null},
                { value: 'quest.tech', text: 'Консультация - техническая' , project: null},
                { value: 'quest.service', text: 'Консультация - услуги' , project: 'CRM'}
            ]
        }
    },
    computed: {
        filtered() {
            if (this.search) {
                let searchStr = this.search.trim().replace(/\s+/g, '');

                if (this.search.indexOf('.') > -1) {
                    return this.items.filter( row => row.contract === searchStr);
                } else if (this.search.startsWith('0')) {
                    return this.items.filter( row => row.srcNumber.startsWith(searchStr));
                } else {
                    return []
                }
            } else {
                return this.items;
            }
        }
    },
    methods: {
        getRowVariant(item) {

            if (item.handled) {
                return 'table-success';
            } else {

            }
        },
        getJiraAuth() {
            let data = window.localStorage.getItem('itel.settings');
            if (data) {
                let settings = JSON.parse(data);
                return settings.jiraAuth;
            } else {
                throw new Error('there were no login stored for jira. go to settings first')
            }
        },
        getJiraLabel( item ) {
            return item.jira ? item.jira : 'Создать заявку';

        },
        processJira( item ) {
            let issue = this.categories.find( _ => _.value === item.category),
                data = {
                    auth: this.getJiraAuth(),
                    project: issue.project,
                    summary: `${issue.text} :: ${item.srcNumber}`,
                    description: item.description
                };

            fetch('/bino/jira', {
                method: 'POST',
                headers: { "Content-Type": "application/json; charset=utf-8"},
                body: JSON.stringify(data),
            }).then( _ => _.json()).then( jira => {
                item.jira = jira.key;
            })
        },
        addNumberButtonAvailable( item ) {
            return (item.client && item.client.phones && item.client.phones.field_value.indexOf(item.srcNumber) === -1)
        },
        addNumber( item ) {
            item.client.phones.field_value += ", " +  item.srcNumber;

            JSON.post(`${window.global.api.bill}`, {
                action: 'addPhone',
                data: item.client.phones
            });
        },
        getClientInfo( item ) {
            if (item.client) {
                return `ФИО: ${item.client.user.fio}   Тел.: ${item.client.phones.field_value}`
            } else {
                return null
            }
        },
        getCategory({item}, part) {
            if (item.category && item.category.length > 0) {
                let category = this.categories.find( _ => _.value === item.category);
                return category.text.split("-")[part].trim();
            } else {
                return ''
            }
        },
        saveRecord(row) {
            let status;
            row.item.handled = true;
            row.item.$ver++;
            let record = Object.assign({}, row.item);
            delete record._showDetails;

            JSON.put(`/bino/cdr`, record).then(_=> {
                row.toggleDetails();

            }).catch(
                // show an error about a stale version or like that
                err => console.log(err)
            );

        },
        showDetails(row) {
            let { item, index } = row;
            //item.clientInfo = null;
            row.toggleDetails();
        },
        filterOut({item}) {
            if (this.search) {
                this.search = null;
            } else {
                if (item.contract) {
                    this.search = item.contract
                } else {
                    this.search = item.srcNumber
                }
            }

            window.bus.$emit('NAV.setFilter', this.search);
        },
        checkContract(row) {
            fetch(
                `${window.global.api.bill}?action=getUserByContract&contract=${row.item.contract}`
            ).then( _ => _.json()).then(
                info => row.item.client = info
            );
        },
        onRecordUpdate(record) {
            let item = this.$data.items.find( _ => _.callId == record.callId);
            if (item.$ver < record.$ver) {
                Object.assign(item, record);
            }

        },
        onRecordInsert(record) {
            if (record.extNumber == this.extNumber) record._showDetails = true;
            this.$data.items.unshift(record);
        },
        editingDisabled(record) {
            return (record.extNumber != this.extNumber);
        }
    },

    created() {
        let settings = window.localStorage.getItem('itel.settings');
        if (settings) {
            let data = JSON.parse(settings);
            this.extNumber = data.ext;
        }

        fetch('/bino/cdr').then( _ => _.json()).then( items => this.items = items);
    },

    mounted() {
        window.bus.$on('CDR.add', _ => {
            this.items.unshift(_)
        });

        window.bus.$on('CDR.filter', _ => {
            this.search = _;
        });

        window.bus.$on('CDR.refresh', settings => {
            this.extNumber = settings.ext;
        });

        window.ws.onmessage = message => {
            if (message.data) {
                let data = JSON.parse(message.data);

                if (data.event === 'update') this.onRecordUpdate(data.data);
                if (data.event === 'insert') this.onRecordInsert(data.data);

            }

        };
    },

});