Vue.component('i-nav', {
    template: `
        <b-navbar toggleable="md" type="light" variant="light">

            <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
            
            <b-navbar-brand href="#">i.Tel</b-navbar-brand>
            
            <b-collapse is-nav id="nav_collapse">
            
                <b-navbar-nav>
  
                <b-input-group  size="sm">
                    <b-form-input v-model="search" placeholder = "Договор или Телефон" />
                    <b-input-group-append>
                        <b-btn @click="this.resetFilter" v-if="search"><i class="fas fa-times-circle"></i></b-btn>
                        <b-btn @click="this.filter"><i class="fas fa-search"></i></b-btn>
                    </b-input-group-append>
                  </b-input-group>
                
                </b-navbar-nav>
                
                <!-- Right aligned nav items -->
                <b-navbar-nav class="ml-auto">
                    <b-dropdown class="mx-2" size="sm" right :text="activityStateLabel" :variant="activityStateColor">
                        <b-dropdown-item-button @click = "this.toggleState">{{states.active.label}}</b-dropdown-item-button>
                        <b-dropdown-item-button @click = "this.toggleState">{{states.paused.label}}</b-dropdown-item-button>
                    </b-dropdown>
                    <b-button size="sm"  v-b-modal.modalSettings >
                        <i class="fas fa-cog"></i>
                    </b-button>
                    <b-modal id="modalSettings" title="Настройки"
                        @ok = "this.saveSettings"
                        @show = "this.restoreSettings"
                    >
                        <b-table stacked 
                            :items="settings"
                            tbody-class="zero-border"
                            :fields="fields"
                        >
                            <template slot="ext" slot-scope="row">
                                <b-form-input v-model="row.item.ext" type = "text" />
                            </template>
                            <template slot="jiraLogin" slot-scope="row">
                                <b-form-input v-model="row.item.jiraLogin" type = "text" />
                            </template>
                            <template slot="jiraPassword" slot-scope="row">
                                <b-form-input v-model="row.item.jiraPassword" type = "password" />
                            </template>
                        
                        </b-table>
                    </b-modal>
                </b-navbar-nav>
            
            </b-collapse>
        </b-navbar>
    `,
    data: function () {
        return {
            currentState: 'active',
            states: {
                paused:  {label: 'Перерыв',  variant: 'warning'},
                active: {label: 'Работа',   variant: 'success'}
            },
            search: null,
            fields: ['ext', 'jiraLogin', 'jiraPassword'],
            settings: [{
                ext: null,
                jiraLogin: null,
                jiraPassword: null,
                jiraAuth: null
            }]
        }
    },
    computed: {
        activityStateColor() {
            return this.states[this.currentState].variant
        },
        activityStateLabel() {
            return this.states[this.currentState].label
        }
    },
    methods: {
        toggleState() {
            this.currentState = this.currentState === 'active' ? 'paused' : 'active';
            // Save state change in DB
        },
        restoreSettings() {
            let data = window.localStorage.getItem('itel.settings');
            if (data) this.settings = [JSON.parse(data)];
        },
        saveSettings() {
            let settings = this.settings[0];

            settings.jiraAuth = btoa(settings.jiraLogin + ":" + settings.jiraPassword);
            settings.jiraPassword = null;
            window.localStorage.setItem('itel.settings', JSON.stringify(settings));
            window.bus.$emit('CDR.refresh', settings);
        },
        resetFilter() {
            window.bus.$emit('CDR.filter', this.search = null);
        },
        filter() {
            window.bus.$emit('CDR.filter', this.search);
        }
    },
    mounted() {
        window.bus.$on('NAV.setFilter', _ => this.search = _ );
    },
});