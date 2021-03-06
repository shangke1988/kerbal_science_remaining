def rotate_rows(rows)
    out_rows = []
    rows.first.size.times do |col_i|
        out_rows[col_i] = []
        rows.size.times do |row_i|
            out_rows[col_i][row_i] = rows[row_i][col_i]
        end
    end
    return out_rows
end

def read_tsv(file, options={})
    rows = []
    File.open(file, 'r') do |f| 
        f.read().each_line do |l|
            rows.push l.strip.split("\t").map{|x| x.strip}
        end
    end
    if not options[:rotate].nil?
        rows = rotate_rows(rows)
    end
    headers = rows.shift
    headers.shift
    
    data = {}
    for row in rows
        row_data = {}
        row_title = row.shift
        for field in headers
            value = row.shift
            row_data[field] = value if not value.nil?
        end
        data[row_title] = row_data
    end
    return data
end


MULTIPLIER_FIELDS = {
    'Surface: Landed' => 'Landed multiplier',
    'Surface: Splashed' => 'Splashed multiplier',
    'Flying Low' => 'Low Flying multiplier',
    'Flying High' => 'High Flying multiplier',
    'In Space Low' => 'Low space multiplier',
    'In Space High' => 'High space multiplier',
    'Recovery' =>'Recovery multiplier'
}

def body_multiplier(body, situation)
    value = body[MULTIPLIER_FIELDS[situation]]
    return nil if value == "N/A"
    return value.to_f
end

def body_has_atmosphere?(body)
    return body['Atmosphere multiplier'] != 'N/A'
end

def valid_expiriment?(module_name, module_data, biome, biome_data, body, situation, situation_data)
    # return false if not module_name == "Temperature Scan"
    multiplier = body_multiplier(body, situation)
    return false if multiplier.nil?
    return false if biome_data['SURFACE_ONLY'] and not situation.start_with?("Surface")
    return false if module_data['Atmosphere Required'] == 'Y' and not body_has_atmosphere?(body)
    
    type = situation_data[module_name]
    if type == "Global"
        return biome_data['Body'] == biome # Only on main planet
    elsif type == "Biome"
        return biome_data['Body'] != biome # On all biome, but not main planet
    end
    
    # p situations
    return false
end

def science_value(module_name, module_data, situation, body)
    return body_multiplier(body, situation) * module_data['Base value'].to_f
end

def max_science_value(module_name, module_data, situation, body)
    return body_multiplier(body, situation) * module_data['Maximum value'].to_f
end


modules = read_tsv 'modules.tsv', :rotate => true
bodies = read_tsv 'bodies.tsv'
biomes_f = read_tsv 'biomes.tsv'
situations = read_tsv 'situations.tsv'
recoverys = read_tsv 'recoverys.tsv', :rotate => true

biomes={}
for body, body_data in bodies
    biomes[body] = {"Biome"=>body,"Body"=>body,}
end
biomes.update(biomes_f)

for biome_full, biome_data  in biomes
    body = biome_data["Body"]
    biome = biome_data["Biome"]
    body_data = bodies[body]
    for module_name, module_data in modules
        for situation, situation_data in situations
            next if biome == "Water" and situation == "Surface: Landed"
            next if biome != "Water" and biome != "Shores" and situation == "Surface: Splashed"
            next unless valid_expiriment?(module_name, module_data, biome, biome_data, body_data, situation, situation_data)
            science = science_value(module_name, module_data, situation, body_data)
            science_max = max_science_value(module_name, module_data, situation, body_data)
            puts [body, biome, module_name, module_data['Tech level'], situation, science, science_max].join(",")
        end
    end
    if biome==body
        body2 = body=="Kerbin" ? "Kerbin" : "Other"
        for recovery, recovery_data in recoverys
            science = recovery_data[body2 + ' Base Value']
            next if science=='N/A'
            science_max = recovery_data[body2 + ' Max Value']
            recovery_multiplier = body_multiplier(body_data, 'Recovery')
            science = recovery_multiplier * science.to_f
            science_max = recovery_multiplier * science_max.to_f
            puts [body, biome, "recovery", "1", recovery, science, science_max].join(",")
        end
    end
end




# p situations
# p biomes
# p modules
# p bodies
